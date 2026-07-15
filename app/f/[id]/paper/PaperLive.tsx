"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, EyeOff, MailOpen, RotateCcw } from "lucide-react";
import type { FundingLiveData } from "@/app/lib/server/fundings";
import { useFundingUpdates } from "@/app/lib/hooks/useFundingUpdates";
import {
  markPaperOpened,
  useEditTokens,
  usePaperOpened,
} from "@/app/lib/paperTokens";
import PaperCard from "../PaperCard";

export default function PaperLive({
  fundingId,
  title,
  ownerName,
  isOwner,
  initial,
}: {
  fundingId: string;
  title: string;
  ownerName: string | null;
  isOwner: boolean;
  initial: FundingLiveData;
}) {
  const [replaying, setReplaying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const editTokens = useEditTokens(fundingId);
  const hasOpened = usePaperOpened(fundingId);
  const { data, fetchNow } = useFundingUpdates(
    fundingId,
    initial,
    undefined,
    "paper",
  );

  const opening =
    data.closed &&
    data.contributions.length > 0 &&
    ((!hasOpened && !dismissed) || replaying);

  const finishOpening = useCallback(() => {
    markPaperOpened(fundingId);
    setDismissed(true);
    setReplaying(false);
  }, [fundingId]);

  const openingCards = useMemo(
    () => [...data.contributions].reverse(),
    [data.contributions],
  );
  const revealStep = Math.min(0.45, 3 / Math.max(openingCards.length, 1));

  useEffect(() => {
    if (!opening) return;
    const totalSeconds = revealStep * Math.max(openingCards.length - 1, 0) + 1.8;
    const timer = setTimeout(finishOpening, totalSeconds * 1000);
    return () => clearTimeout(timer);
  }, [finishOpening, opening, openingCards.length, revealStep]);

  const replay = () => setReplaying(true);
  const hiddenCards = data.hiddenContributions ?? [];

  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link
          href={`/f/${fundingId}`}
          className="mb-7 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <ArrowLeft size={15} /> 펀딩으로 돌아가기
        </Link>

        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
            <MailOpen size={24} />
          </div>
          <p className="text-sm text-brand-500">
            {data.closed ? "완성된 축하 롤링페이퍼" : "실시간 축하 롤링페이퍼"}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{ownerName ?? "친구"}님에게 온 마음</h1>
          <p className="mt-2 text-sm text-neutral-500">{title}</p>
          <p className="mt-3 text-xs text-neutral-400">
            {data.closed
              ? `${data.participantCount}명의 마음이 모두 도착했어요.`
              : `${data.participantCount}명이 함께했어요. 새 카드는 자동으로 나타나요.`}
          </p>
          {data.closed && data.contributions.length > 0 && !opening && (
            <button
              type="button"
              onClick={replay}
              className="mt-4 inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              <RotateCcw size={13} /> 처음부터 다시 보기
            </button>
          )}
        </header>

        {data.contributions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/10 p-12 text-center text-sm text-neutral-400 dark:border-white/15">
            아직 카드가 없어요.
          </p>
        ) : (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.contributions.map((contribution) => (
              <PaperCard
                key={contribution.id}
                fundingId={fundingId}
                contribution={contribution}
                editToken={editTokens[contribution.id]}
                closed={data.closed}
                isOwner={isOwner}
                onChanged={fetchNow}
              />
            ))}
          </motion.section>
        )}

        {isOwner && hiddenCards.length > 0 && (
          <section id="hidden-cards" className="mt-12 scroll-mt-20 space-y-4">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                <EyeOff size={15} /> 숨긴 카드 {hiddenCards.length}장
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                다른 방문자에게는 보이지 않아요. 언제든 다시 공개할 수 있어요.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hiddenCards.map((contribution) => (
                <PaperCard
                  key={contribution.id}
                  fundingId={fundingId}
                  contribution={contribution}
                  closed={data.closed}
                  isOwner
                  hidden
                  onChanged={fetchNow}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <AnimatePresence>
        {opening && (
          <motion.div
            key="paper-opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-10 dark:from-neutral-950 dark:via-neutral-900 dark:to-amber-950"
          >
            <button
              type="button"
              onClick={finishOpening}
              className="fixed right-5 top-5 z-10 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-medium text-neutral-600 backdrop-blur dark:border-white/15 dark:bg-neutral-900/80 dark:text-neutral-300"
            >
              건너뛰기
            </button>

            <div className="mx-auto max-w-4xl">
              <motion.header
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 pt-8 text-center"
              >
                <p className="text-sm font-medium text-brand-500">{ownerName ?? "친구"}님에게</p>
                <h2 className="mt-2 text-3xl font-bold">마음을 펼쳐볼게요 💌</h2>
              </motion.header>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openingCards.map((contribution, index) => (
                  <motion.div
                    key={contribution.id}
                    initial={{ opacity: 0, y: 32, scale: 0.88, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    transition={{
                      delay: index * revealStep,
                      duration: 0.55,
                      type: "spring",
                      stiffness: 130,
                      damping: 16,
                    }}
                  >
                    <PaperCard
                      fundingId={fundingId}
                      contribution={contribution}
                      closed
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
