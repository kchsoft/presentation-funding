import ogs from "open-graph-scraper";
import type { OgImage, OgResult } from "./types";

// 일부 커머스 사이트(쿠팡/스마트스토어 등)는 봇 차단이 있어
// 브라우저처럼 보이는 User-Agent / Accept 헤더를 함께 보낸다.
const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
}

/** 상대경로를 절대경로로 변환한다. */
function absolutize(value: string | null, base: string): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

/** og:image 가 문자열/객체/배열 등 다양한 형태로 오므로 모두 정규화한다. */
function normalizeImages(raw: unknown, base: string): OgImage[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const out: OgImage[] = [];
  for (const item of arr) {
    let url: string | null = null;
    let extra: Partial<OgImage> = {};
    if (typeof item === "string") {
      url = item;
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      url = str(o.url);
      extra = {
        width: str(o.width) ?? undefined,
        height: str(o.height) ?? undefined,
        alt: str(o.alt) ?? undefined,
        type: str(o.type) ?? undefined,
      };
    }
    const abs = absolutize(url, base);
    if (abs) out.push({ url: abs, ...extra });
  }
  return out;
}

/**
 * "1,290,000원" / "369000.00" / 369000 처럼 제각각인 가격 표기를
 * 원 단위 정수 문자열로 정규화한다. 해석할 수 없거나 0 이하면 null.
 */
function normalizePrice(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  // 통화 기호·쉼표·공백은 버리고 숫자와 소수점만 남긴다.
  const cleaned = String(v).replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.round(n));
}

/**
 * JSON-LD(schema.org)에서 상품 가격을 찾는다.
 *
 * 실제 쇼핑몰은 og:price:amount 같은 페이스북 커머스 메타를 거의 쓰지 않고
 * Product/Offer JSON-LD로만 가격을 노출한다. OG 메타가 없을 때의 폴백이다.
 *
 * @graph 중첩, offers 배열/단일 객체, AggregateOffer(lowPrice),
 * 그리고 ProductGroup + hasVariant(나이키 등 옵션 상품)를 모두 처리한다.
 */
export function extractJsonLdPrice(jsonLD: unknown): {
  price: string | null;
  currency: string | null;
} {
  const empty = { price: null, currency: null };

  // Product를 찾을 때까지 넓게 훑는다. 깊이 제한으로 순환/거대 문서를 방어한다.
  function walk(node: unknown, depth: number): Record<string, unknown> | null {
    if (depth > 6 || !node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    const o = node as Record<string, unknown>;
    const types = Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]];
    const isProduct = types.some(
      (t) => t === "Product" || t === "ProductGroup",
    );
    if (isProduct && o.offers) return o;
    // ProductGroup은 자기 offers 없이 hasVariant의 각 Product에만 가격을 둔다.
    return walk(o["@graph"], depth + 1) ?? walk(o.hasVariant, depth + 1);
  }

  const product = walk(jsonLD, 0);
  if (!product) return empty;

  const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
  for (const offer of offers) {
    if (!offer || typeof offer !== "object") continue;
    const o = offer as Record<string, unknown>;
    // AggregateOffer는 price 대신 lowPrice를 쓴다 — 가장 싼 값을 기준으로 잡는다.
    const price = normalizePrice(o.price) ?? normalizePrice(o.lowPrice);
    if (price) return { price, currency: str(o.priceCurrency) };
  }

  return empty;
}

export async function fetchOg(target: string): Promise<OgResult> {
  const host = new URL(target).host;

  // open-graph-scraper는 실패 시 결과 객체를 반환하기도 하고,
  // 네트워크/차단 오류 시 reject 하기도 하므로 둘 다 처리한다.
  let result: Record<string, unknown>;
  try {
    const res = await ogs({
      url: target,
      fetchOptions: { headers: BROWSER_HEADERS },
      timeout: 10000,
    });
    if (res.error) throw new Error("blocked");
    result = res.result as Record<string, unknown>;
  } catch {
    throw new Error(
      "페이지를 가져오지 못했습니다. 사이트가 접근을 차단했거나 응답하지 않습니다.",
    );
  }

  const r = result;
  const images = normalizeImages(r.ogImage, target);
  const twitterImages = normalizeImages(r.twitterImage, target);

  const title = str(r.ogTitle) ?? str(r.twitterTitle) ?? str(r.dcTitle) ?? "";
  const description =
    str(r.ogDescription) ??
    str(r.twitterDescription) ??
    str(r.dcDescription) ??
    "";

  const video = normalizeImages(r.ogVideo, target)[0]?.url ?? null;
  const jsonLdPrice = extractJsonLdPrice(r.jsonLD);

  return {
    title,
    description,
    url: str(r.ogUrl) ?? target,
    siteName: str(r.ogSiteName) ?? host,
    host,

    images,
    favicon: absolutize(str(r.favicon), target),

    type: str(r.ogType),
    locale: str(r.ogLocale),
    date:
      str(r.ogDate) ??
      str(r.articlePublishedTime) ??
      str(r.articleModifiedTime),

    // OG 커머스 메타 → JSON-LD 순. 실제 쇼핑몰은 대부분 후자에만 가격이 있다.
    price:
      normalizePrice(r.ogPriceAmount) ??
      normalizePrice(r.productPriceAmount) ??
      jsonLdPrice.price,
    currency:
      str(r.ogPriceCurrency) ??
      str(r.productPriceCurrency) ??
      jsonLdPrice.currency,
    availability: str(r.ogAvailability) ?? str(r.productAvailability),

    author: str(r.articleAuthor) ?? str(r.author),

    video,

    twitter: {
      card: str(r.twitterCard),
      title: str(r.twitterTitle),
      description: str(r.twitterDescription),
      image: twitterImages[0]?.url ?? null,
      site: str(r.twitterSite),
      creator: str(r.twitterCreator),
    },

    raw: result,

    empty: !title && !description && images.length === 0,
  };
}
