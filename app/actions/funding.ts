"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/server/auth";
import {
  addContribution,
  createFunding,
  deleteFunding,
} from "@/app/lib/server/fundings";

export type ActionState = { error?: string; success?: boolean } | null;

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.url().nullable());

const createSchema = z.object({
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

export async function createFundingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요해요." };

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { deadline, ...rest } = parsed.data;
  // 마감일 당일 23:59까지 참여 가능하도록 하루의 끝으로 저장한다.
  const deadlineDate = new Date(`${deadline}T23:59:59.999`);
  if (deadlineDate < new Date()) {
    return { error: "마감일은 오늘 이후여야 해요." };
  }

  const funding = await createFunding(session.user.id, {
    ...rest,
    deadline: deadlineDate,
  });

  redirect(`/f/${funding.id}`);
}

const contributeSchema = z.object({
  fundingId: z.string().min(1),
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(20, "이름은 20자 이내로 적어주세요."),
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

export async function contributeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contributeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { fundingId, ...data } = parsed.data;
  const result = await addContribution(fundingId, data);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/f/${fundingId}`);
  return { success: true };
}

export async function deleteFundingAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("fundingId");
  if (typeof id !== "string" || !id) return;

  await deleteFunding(id, session.user.id);
  revalidatePath("/me");
  redirect("/me");
}
