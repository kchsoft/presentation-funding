import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gift } from "lucide-react";
import { auth } from "@/app/lib/server/auth";
import { getFunding, toLiveViewModel, totalAmount } from "@/app/lib/server/fundings";
import { progressPercent } from "@/app/lib/format";
import FundingLive from "./FundingLive";

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
  const initial = toLiveViewModel(funding, isOwner);

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
          <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/40 dark:to-brand-900/30">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/70 text-brand-500 dark:bg-white/10">
              <Gift size={36} />
            </div>
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
            <p className="rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
              💌 {funding.message}
            </p>
          )}
        </div>
      </section>

      <FundingLive
        fundingId={funding.id}
        title={funding.title}
        imageUrl={funding.imageUrl}
        isOwner={isOwner}
        ownerName={funding.owner.name}
        initial={initial}
      />
    </main>
  );
}
