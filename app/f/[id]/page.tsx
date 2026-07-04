import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/app/lib/server/auth";
import { getFunding, totalAmount } from "@/app/lib/server/fundings";
import {
  daysLeft,
  formatDate,
  formatKrw,
  progressPercent,
} from "@/app/lib/format";
import ContributeForm from "./ContributeForm";
import ShareButton from "./ShareButton";
import DeleteButton from "./DeleteButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const funding = await getFunding(id);
  if (!funding) return { title: "펀딩을 찾을 수 없어요" };

  const percent = progressPercent(
    totalAmount(funding.contributions),
    funding.goalAmount,
  );
  const title = `${funding.owner.name ?? "친구"}님의 선물 펀딩 🎁`;
  const description = `${funding.title} — ${percent}% 달성! 함께 선물을 완성해주세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(funding.imageUrl ? { images: [funding.imageUrl] } : {}),
    },
  };
}

export default async function FundingPage({ params }: Props) {
  const { id } = await params;
  const [funding, session] = await Promise.all([getFunding(id), auth()]);
  if (!funding) notFound();

  const isOwner = session?.user?.id === funding.owner.id;
  const total = totalAmount(funding.contributions);
  const percent = progressPercent(total, funding.goalAmount);
  const dLeft = daysLeft(funding.deadline);
  const closed = funding.deadline < new Date();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-8 px-6 py-12">
      {/* 상품 카드 */}
      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-neutral-900">
        {funding.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={funding.imageUrl}
            alt={funding.title}
            className="h-64 w-full bg-neutral-100 object-cover dark:bg-neutral-800"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-neutral-100 text-6xl dark:bg-neutral-800">
            🎁
          </div>
        )}
        <div className="space-y-3 p-5">
          <div>
            <p className="text-sm text-neutral-400">
              {funding.owner.name ?? "친구"}님이 받고 싶은 선물
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug">
              {funding.title}
            </h1>
            <a
              href={funding.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {funding.siteName ?? "상품 보러가기"} →
            </a>
          </div>

          {funding.message && (
            <p className="rounded-xl bg-rose-50 p-4 text-sm leading-relaxed text-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
              💌 {funding.message}
            </p>
          )}

          {/* 진행률 */}
          <div className="space-y-2 pt-1">
            <div className="flex items-end justify-between text-sm">
              <span className="text-2xl font-bold text-rose-500">
                {percent}%
              </span>
              <span className="text-neutral-500">
                목표 {formatKrw(funding.goalAmount)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>{funding.contributions.length}명 참여</span>
              <span>
                {closed
                  ? `${formatDate(funding.deadline)} 마감됨`
                  : dLeft === 0
                    ? "오늘 마감!"
                    : `D-${dLeft}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 주최자 전용 패널 */}
      {isOwner && (
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              내 펀딩 관리 (나에게만 보여요)
            </h2>
            <DeleteButton fundingId={funding.id} />
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-200">
            지금까지 모인 금액:{" "}
            <span className="font-bold">{formatKrw(total)}</span>
          </p>
          <ShareButton />
        </section>
      )}

      {/* 참여 폼 */}
      {closed ? (
        <section className="rounded-2xl border border-black/10 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-white/15 dark:bg-neutral-900">
          이 펀딩은 마감됐어요. 마음을 모아준 친구들 고마워요 💛
        </section>
      ) : (
        !isOwner && (
          <section className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-neutral-900">
            <h2 className="font-semibold">마음 보태기</h2>
            <ContributeForm fundingId={funding.id} />
          </section>
        )
      )}

      {/* 참여자 목록 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">
          함께한 친구들 {funding.contributions.length > 0 && `(${funding.contributions.length})`}
        </h2>
        {funding.contributions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-neutral-400 dark:border-white/20">
            아직 참여한 친구가 없어요. 첫 번째 주인공이 되어주세요!
          </p>
        ) : (
          <ul className="space-y-2">
            {funding.contributions.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.name}</span>
                  {/* 개별 금액은 주최자에게만 보인다 */}
                  {isOwner && (
                    <span className="text-sm font-semibold text-rose-500">
                      {formatKrw(c.amount)}
                    </span>
                  )}
                </div>
                {c.message && (
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                    {c.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
