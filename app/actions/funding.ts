"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/server/auth";
import {
  addContribution,
  createFunding,
  deleteFunding,
  updateThankYouMessage,
} from "@/app/lib/server/fundings";
import {
  contributeSchema,
  createSchema,
  thankYouMessageSchema,
} from "@/app/lib/validation/funding";

export type ActionState = { error?: string; success?: boolean } | null;

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

export async function updateThankYouMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요해요." };

  const parsed = thankYouMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const ok = await updateThankYouMessage(
    parsed.data.fundingId,
    session.user.id,
    parsed.data.thankYouMessage,
  );
  if (!ok) return { error: "권한이 없어요." };

  revalidatePath(`/f/${parsed.data.fundingId}`);
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
