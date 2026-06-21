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

    price: str(r.ogPriceAmount) ?? str(r.productPriceAmount),
    currency: str(r.ogPriceCurrency) ?? str(r.productPriceCurrency),
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
