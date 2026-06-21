export interface OgImage {
  url: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
  type?: string;
}

export interface OgResult {
  // 핵심
  title: string;
  description: string;
  url: string;
  siteName: string;
  host: string;

  // 이미지 (여러 장 가능)
  images: OgImage[];
  favicon: string | null;

  // 분류 / 메타
  type: string | null; // og:type (website, product, article ...)
  locale: string | null; // og:locale
  date: string | null; // og:date / article:published_time

  // 커머스
  price: string | null; // 가격 금액
  currency: string | null; // 통화
  availability: string | null; // 재고 상태

  // 기사
  author: string | null;

  // 영상
  video: string | null;

  // 트위터 카드
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    site: string | null;
    creator: string | null;
  };

  // 파싱된 원본 전체 (디버그 / 전체 보기용)
  raw: Record<string, unknown>;

  empty: boolean;
}

export interface OgErrorResponse {
  error: string;
}
