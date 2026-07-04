import { z } from "zod";

// 이 모듈은 zod만 import한다 — Prisma/auth()/next 서버 전용 API를 절대 넣지 않는다.
// 그래야 클라이언트 컴포넌트에서도 그대로 import해서 실시간 유효성 검사에 재사용할 수 있다.

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.url().nullable());

export const createSchema = z.object({
  title: z.string().trim().min(1, "상품명을 입력해주세요.").max(100),
  productUrl: z.url("올바른 상품 링크가 아니에요."),
  imageUrl: optionalUrl,
  siteName: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || null),
  goalAmount: z.coerce
    .number("목표 금액을 입력해주세요.")
    .int()
    .min(1000, "목표 금액은 1,000원 이상이어야 해요.")
    .max(100_000_000, "목표 금액은 1억원 이하여야 해요."),
  message: z
    .string()
    .trim()
    .max(300, "메시지는 300자 이내로 적어주세요.")
    .transform((v) => v || null),
  deadline: z.iso.date("마감일을 선택해주세요."),
});

export const contributeSchema = z.object({
  fundingId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요.")
    .max(20, "이름은 20자 이내로 적어주세요."),
  amount: z.coerce
    .number("금액을 입력해주세요.")
    .int()
    .min(1000, "1,000원부터 참여할 수 있어요.")
    .max(10_000_000, "1,000만원 이하로 입력해주세요."),
  message: z
    .string()
    .trim()
    .max(200, "메시지는 200자 이내로 적어주세요.")
    .transform((v) => v || null),
});

export const thankYouMessageSchema = z.object({
  fundingId: z.string().min(1),
  thankYouMessage: z
    .string()
    .trim()
    .max(200, "감사 메시지는 200자 이내로 적어주세요.")
    .transform((v) => v || null),
});
