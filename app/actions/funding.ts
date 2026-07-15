"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/server/auth";
import {
  addContribution,
  createFunding,
  deleteFunding,
  setContributionHidden,
  updateContributionMessage,
  updateThankYouMessage,
} from "@/app/lib/server/fundings";
import {
  contributeSchema,
  createSchema,
  deleteMessageSchema,
  editMessageSchema,
  thankYouMessageSchema,
} from "@/app/lib/validation/funding";

export type ActionState = { error?: string; success?: boolean } | null;

/** 참여 성공 시 작성 브라우저 저장용 editToken을 1회 반환한다. */
export type ContributeState =
  | { error: string; success?: undefined }
  | { success: true; contributionId: string; editToken: string; error?: undefined }
  | null;

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
  _prev: ContributeState,
  formData: FormData,
): Promise<ContributeState> {
  const parsed = contributeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { fundingId, ...data } = parsed.data;
  const result = await addContribution(fundingId, data);
  if ("error" in result) {
    return { error: result.error ?? "참여를 처리하지 못했어요." };
  }

  revalidatePath(`/f/${fundingId}`);
  revalidatePath(`/f/${fundingId}/paper`);
  return {
    success: true,
    contributionId: result.contribution.id,
    editToken: result.editToken,
  };
}

export async function editContributionMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = editMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { fundingId, contributionId, editToken, message } = parsed.data;
  const ok = await updateContributionMessage(
    fundingId,
    contributionId,
    editToken,
    message,
  );
  if (!ok) return { error: "수정할 수 없어요. 펀딩이 마감됐거나 이 브라우저에서 쓴 카드가 아니에요." };

  revalidatePath(`/f/${fundingId}`);
  revalidatePath(`/f/${fundingId}/paper`);
  return { success: true };
}

/** "삭제" = 메시지만 비우기. 참여(금액) 기록은 유지되어 이름 카드로 전환된다. */
export async function deleteContributionMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { fundingId, contributionId, editToken } = parsed.data;
  const ok = await updateContributionMessage(
    fundingId,
    contributionId,
    editToken,
    null,
  );
  if (!ok) return { error: "삭제할 수 없어요. 펀딩이 마감됐거나 이 브라우저에서 쓴 카드가 아니에요." };

  revalidatePath(`/f/${fundingId}`);
  revalidatePath(`/f/${fundingId}/paper`);
  return { success: true };
}

/** 주인공 전용 — 카드 숨김/해제 토글. hidden 필드가 "1"이면 숨김. */
export async function toggleCardHiddenAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요해요." };

  const fundingId = formData.get("fundingId");
  const contributionId = formData.get("contributionId");
  if (
    typeof fundingId !== "string" || !fundingId ||
    typeof contributionId !== "string" || !contributionId
  ) {
    return { error: "잘못된 요청이에요." };
  }

  const hidden = formData.get("hidden") === "1";
  const ok = await setContributionHidden(
    fundingId,
    contributionId,
    session.user.id,
    hidden,
  );
  if (!ok) return { error: "권한이 없어요." };

  revalidatePath(`/f/${fundingId}`);
  revalidatePath(`/f/${fundingId}/paper`);
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
