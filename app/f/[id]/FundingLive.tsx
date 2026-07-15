"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Clock, EyeOff, MailOpen, Users } from "lucide-react";
import type { FundingLiveData } from "@/app/lib/server/fundings";
import { formatKrw } from "@/app/lib/format";
import { useCountUp } from "@/app/lib/hooks/useCountUp";
import { useFundingUpdates } from "@/app/lib/hooks/useFundingUpdates";
import { useEditTokens } from "@/app/lib/paperTokens";
import Confetti from "@/app/components/Confetti";
import ContributeForm from "./ContributeForm";
import PaperCard from "./PaperCard";
import ShareButton from "./ShareButton";
import DeleteButton from "./DeleteButton";
import ThankYouEditor from "./ThankYouEditor";
import ToastStack, { type ToastItem } from "./ToastStack";

export default function FundingLive({
  fundingId,
  title,
  isOwner,
  ownerName,
  initial,
}: {
  fundingId: string;
  title: string;
  isOwner: boolean;
  ownerName: string | null;
  initial: FundingLiveData;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const editTokens = useEditTokens(fundingId);

  // 목표 달성 축하는 "실시간으로 넘어가는 순간"에만 터뜨린다 — 이미 달성된 펀딩을
  // 다시 방문했을 때 매번 재생되는 걸 막기 위해 초기값을 실제 초기 총액으로 잡는다.
  const prevTotalRef = useRef(initial.total);
  const seenIdsRef = useRef(new Set(initial.contributions.map((c) => c.id)));
  const toastTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const pushToast = useCallback((text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimersRef.current.delete(timer);
    }, 4000);
    toastTimersRef.current.add(timer);
  }, []);

  // 언마운트 시 아직 남아있는 토스트 자동 닫힘 타이머를 모두 정리한다.
  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const applyUpdate = useCallback(
    (next: FundingLiveData) => {
      const newOnes = next.contributions.filter(
        (c) => !seenIdsRef.current.has(c.id),
      );
      for (const c of newOnes) {
        pushToast(`${c.name}님이 방금 참여했어요 🎉`);
        seenIdsRef.current.add(c.id);
      }

      if (
        prevTotalRef.current < next.goalAmount &&
        next.total >= next.goalAmount
      ) {
        setConfettiTrigger((n) => n + 1);
      }
      prevTotalRef.current = next.total;

    },
    [pushToast],
  );

  const { data, fetchNow } = useFundingUpdates(fundingId, initial, applyUpdate);

  const percentDisplay = useCountUp(data.percent);
  const hiddenCount = data.hiddenContributions?.length ?? 0;
  const ownerContributions = [
    ...data.contributions,
    ...(data.hiddenContributions ?? []),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Confetti trigger={confettiTrigger} />
      <ToastStack toasts={toasts} />

      {/* 진행률 */}
      <section className="space-y-2">
        <div className="flex items-end justify-between text-sm">
          <span className="text-2xl font-bold text-brand-500">
            {percentDisplay}%
          </span>
          <span className="text-neutral-500">
            목표 {formatKrw(data.goalAmount)}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            animate={{ width: `${data.percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {data.participantCount}명 참여
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {data.deadlineLabel}
          </span>
        </div>
      </section>

      {/* 감사 메시지 (공개) */}
      {data.thankYouMessage && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-200">
            💚 {data.thankYouMessage}
          </p>
          <p className="mt-2 text-xs text-emerald-700/70 dark:text-emerald-400/70">
            — {ownerName ?? "주최자"}
          </p>
        </section>
      )}

      {/* 주최자 전용 패널 */}
      {isOwner && (
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              내 펀딩 관리 (나에게만 보여요)
            </h2>
            <DeleteButton fundingId={fundingId} />
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-200">
            지금까지 모인 금액:{" "}
            <span className="font-bold">{formatKrw(data.total)}</span>
          </p>
          <ShareButton title={title} />
          <ThankYouEditor
            fundingId={fundingId}
            initialMessage={data.thankYouMessage}
            onSuccess={fetchNow}
          />
          {ownerContributions.length > 0 && (
            <div className="space-y-2 border-t border-amber-200 pt-3 dark:border-amber-900">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                참여 내역
              </p>
              <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                {ownerContributions.map((contribution) => (
                  <li
                    key={contribution.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{contribution.name}</span>
                    {contribution.amount !== undefined && (
                      <span className="shrink-0 font-semibold">
                        {formatKrw(contribution.amount)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hiddenCount > 0 && (
            <Link
              href={`/f/${fundingId}/paper#hidden-cards`}
              className="flex items-center gap-1 text-xs font-medium text-amber-700 underline underline-offset-2 dark:text-amber-300"
            >
              <EyeOff size={12} /> 숨긴 카드 {hiddenCount}장 관리하기
            </Link>
          )}
        </section>
      )}

      {/* 참여 폼 */}
      {data.closed ? (
        <section className="rounded-2xl border border-black/10 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-white/15 dark:bg-neutral-900">
          이 펀딩은 마감됐어요. 마음을 모아준 친구들 고마워요 💛
        </section>
      ) : (
        !isOwner && (
          <section className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-neutral-900">
            <h2 className="font-semibold">마음 보태기</h2>
            <ContributeForm
              fundingId={fundingId}
              ownerName={ownerName}
              onSuccess={fetchNow}
            />
          </section>
        )
      )}

      {/* 롤링페이퍼 미리보기 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              <MailOpen size={15} className="text-brand-500" /> 축하 롤링페이퍼
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              {data.closed ? "친구들의 마음이 모두 도착했어요." : "친구들의 마음이 실시간으로 쌓이고 있어요."}
            </p>
          </div>
          <Link
            href={`/f/${fundingId}/paper`}
            className="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
          >
            크게 보기
          </Link>
        </div>
        {data.contributions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-neutral-400 dark:border-white/20">
            아직 카드가 없어요. 첫 번째 마음을 남겨주세요!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.contributions.slice(0, 4).map((contribution) => (
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
          </div>
        )}
        {data.contributions.length > 4 && (
          <Link
            href={`/f/${fundingId}/paper`}
            className="block text-center text-xs font-medium text-brand-500 hover:text-brand-600"
          >
            카드 {data.contributions.length - 4}장 더 보기 →
          </Link>
        )}
      </section>
    </>
  );
}
