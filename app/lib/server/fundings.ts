import { cache } from "react";
import { prisma } from "./db";

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

  const contribution = await prisma.contribution.create({
    data: { fundingId, ...data },
  });
  return { contribution } as const;
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
