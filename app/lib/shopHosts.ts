// 이 모듈은 순수 함수만 둔다 — 클라이언트 컴포넌트에서도 그대로 import한다.

/**
 * 자동 조회를 시도하지 않는 쇼핑몰.
 *
 * robots.txt에서 `User-agent: * → Disallow: /` 로 명시적으로 금지했거나,
 * 상품 페이지에 CAPTCHA를 걸어둔 곳이다. 요청해봐야 실패하므로 아예 보내지 않고
 * 사용자에게 바로 직접 입력을 안내한다 — 헛되이 기다리게 하지 않는 게 목적이다.
 */
const NO_AUTO_FETCH: { suffix: string; name: string }[] = [
  { suffix: "coupang.com", name: "쿠팡" },
  { suffix: "smartstore.naver.com", name: "네이버 스마트스토어" },
  { suffix: "brand.naver.com", name: "네이버 브랜드스토어" },
  { suffix: "shopping.naver.com", name: "네이버쇼핑" },
];

/**
 * 받침 유무에 따라 은/는을 붙인다. "쿠팡은", "네이버 스마트스토어는".
 * 한글이 아닌 글자로 끝나면(예: 29CM) 받침을 판단할 수 없어 "는"으로 둔다.
 */
export function withTopicParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;
  const hasFinalConsonant = isHangulSyllable && (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? "은" : "는"}`;
}

/** 자동 조회를 막아둔 쇼핑몰이면 그 이름을, 아니면 null을 돌려준다. */
export function blockedShopName(value: string): string | null {
  let host: string;
  try {
    host = new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
  const match = NO_AUTO_FETCH.find(
    ({ suffix }) => host === suffix || host.endsWith(`.${suffix}`),
  );
  return match?.name ?? null;
}
