import { cache } from "react";
import { prisma } from "./db";
import { daysLeft, formatDate, progressPercent } from "../format";

// generateMetadata와 페이지가 같은 요청에서 중복 조회하지 않도록 React cache로 메모이즈.
export const getFunding = cache(async (id: string) => {
  return prisma.funding.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      contributions: { orderBy: { createdAt: "desc" } },
    },
  });
});

export type FundingDetail = NonNullable<Awaited<ReturnType<typeof getFunding>>>;

export async function createFunding(
  ownerId: string,
  data: {
    title: string;
    productUrl: string;
    imageUrl: string | null;
    siteName: string | null;
    goalAmount: number;
    message: string | null;
    deadline: Date;
  },
) {
  return prisma.funding.create({ data: { ownerId, ...data } });
}

/** 소유자 본인일 때만 삭제된다. 삭제됐으면 true. */
export async function deleteFunding(id: string, ownerId: string) {
  const res = await prisma.funding.deleteMany({ where: { id, ownerId } });
  return res.count > 0;
}

/** 소유자 본인일 때만 감사 메시지를 수정할 수 있다. 성공하면 true. */
export async function updateThankYouMessage(
  id: string,
  ownerId: string,
  thankYouMessage: string | null,
) {
  const res = await prisma.funding.updateMany({
    where: { id, ownerId },
    data: { thankYouMessage },
  });
  return res.count > 0;
}

export async function addContribution(
  fundingId: string,
  data: { name: string; amount: number; message: string | null },
) {
  const funding = await prisma.funding.findUnique({
    where: { id: fundingId },
    select: { deadline: true },
  });
  if (!funding) return { error: "펀딩을 찾을 수 없습니다." } as const;
  if (funding.deadline < new Date())
    return { error: "이미 마감된 펀딩이에요." } as const;

  // 작성 브라우저에서만 수정·삭제할 수 있도록 추측 불가능한 토큰을 발급한다.
  // 생성 직후 이 응답에 1회만 노출되고, 이후 어떤 조회 응답에도 포함되지 않는다.
  const editToken = crypto.randomUUID();
  const contribution = await prisma.contribution.create({
    data: { fundingId, editToken, ...data },
  });
  return { contribution, editToken } as const;
}

/**
 * 작성 브라우저(editToken 일치)만, 마감 전까지만 메시지를 수정·삭제할 수 있다.
 * message가 null이면 "삭제" — 메시지만 비우고 참여(금액) 기록은 이름 카드로 남는다.
 * 숨김 상태(hiddenAt)는 건드리지 않는다. 성공하면 true.
 */
export async function updateContributionMessage(
  fundingId: string,
  contributionId: string,
  editToken: string,
  message: string | null,
) {
  const res = await prisma.contribution.updateMany({
    where: {
      id: contributionId,
      fundingId,
      editToken,
      funding: { deadline: { gt: new Date() } },
    },
    data: { message },
  });
  return res.count > 0;
}

/** 주인공(펀딩 소유자)만 카드를 숨기거나 해제한다. 참여 기록·금액 집계는 유지된다. */
export async function setContributionHidden(
  fundingId: string,
  contributionId: string,
  ownerId: string,
  hidden: boolean,
) {
  const res = await prisma.contribution.updateMany({
    where: { id: contributionId, fundingId, funding: { ownerId } },
    data: { hiddenAt: hidden ? new Date() : null },
  });
  return res.count > 0;
}

export async function listMyFundings(ownerId: string) {
  return prisma.funding.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { contributions: { select: { amount: true } } },
  });
}

export function totalAmount(contributions: { amount: number }[]) {
  return contributions.reduce((sum, c) => sum + c.amount, 0);
}

/** 실시간 폴링 API와 최초 서버 렌더링이 동일한 모양을 쓰도록 하는 뷰모델. */
export interface LiveContribution {
  id: string;
  name: string;
  message: string | null;
  createdAt: string;
  amount?: number;
}

export interface FundingLiveData {
  total: number;
  percent: number;
  goalAmount: number;
  deadline: string;
  closed: boolean;
  /** "D-3" / "오늘 마감!" / "2026년 8월 1일 마감됨" — 서버 시계 기준으로 한 번 계산해
   *  모든 방문자에게 동일한 문구를 보여준다. 타임존이 다른 방문자마다 다르게
   *  계산되는 걸 막기 위해 클라이언트에서 재계산하지 않는다. */
  deadlineLabel: string;
  thankYouMessage: string | null;
  /** 숨긴 카드를 포함한 전체 참여 수 — 숨김은 표시만 제외할 뿐 집계는 유지한다. */
  participantCount: number;
  /** 롤링페이퍼 카드 = Contribution. 숨긴 카드는 모든 방문자 응답에서 제외된다. */
  contributions: LiveContribution[];
  /** 주인공에게만 포함 — 숨긴 카드 확인·해제 UI용. */
  hiddenContributions?: LiveContribution[];
}

function computeDeadlineLabel(deadline: Date, closed: boolean): string {
  if (closed) return `${formatDate(deadline)} 마감됨`;
  const d = daysLeft(deadline);
  return d === 0 ? "오늘 마감!" : `D-${d}`;
}

/** Date → ISO 문자열로 직렬화하고, 개별 금액은 isOwner일 때만 포함한다.
 *  editToken은 어떤 응답에도 절대 포함하지 않는다 — 생성 시 1회만 노출된다. */
export function toLiveViewModel(
  funding: FundingDetail,
  isOwner: boolean,
  { includeAmounts = true }: { includeAmounts?: boolean } = {},
): FundingLiveData {
  const total = totalAmount(funding.contributions);
  const closed = funding.deadline < new Date();

  const serialize = (c: FundingDetail["contributions"][number]): LiveContribution => ({
    id: c.id,
    name: c.name,
    message: c.message,
    createdAt: c.createdAt.toISOString(),
    ...(isOwner && includeAmounts ? { amount: c.amount } : {}),
  });

  const visible = funding.contributions.filter((c) => !c.hiddenAt);
  const hidden = funding.contributions.filter((c) => c.hiddenAt);

  return {
    total,
    percent: progressPercent(total, funding.goalAmount),
    goalAmount: funding.goalAmount,
    deadline: funding.deadline.toISOString(),
    closed,
    deadlineLabel: computeDeadlineLabel(funding.deadline, closed),
    thankYouMessage: funding.thankYouMessage,
    participantCount: funding.contributions.length,
    contributions: visible.map(serialize),
    ...(isOwner ? { hiddenContributions: hidden.map(serialize) } : {}),
  };
}

/** 플랫폼 전체 통계 — 랜딩페이지 통계 섹션에서 사용. */
export async function getPlatformStats() {
  const [{ _sum }, fundingCount] = await Promise.all([
    prisma.contribution.aggregate({ _sum: { amount: true } }),
    prisma.funding.count(),
  ]);
  return {
    totalFunded: _sum.amount ?? 0,
    fundingCount,
  };
}
