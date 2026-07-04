"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Clock, Users } from "lucide-react";
import type { FundingLiveData } from "@/app/lib/server/fundings";
import { formatKrw } from "@/app/lib/format";
import { useCountUp } from "@/app/lib/hooks/useCountUp";
import Confetti from "@/app/components/Confetti";
import ContributeForm from "./ContributeForm";
import ShareButton from "./ShareButton";
import DeleteButton from "./DeleteButton";
import ThankYouEditor from "./ThankYouEditor";
import ToastStack, { type ToastItem } from "./ToastStack";

const POLL_INTERVAL_MS = 5000;

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
  const [data, setData] = useState(initial);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

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

      setData(next);
    },
    [pushToast],
  );

  const fetchNow = useCallback(async () => {
    try {
      const res = await fetch(`/api/fundings/${fundingId}/updates`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const next: FundingLiveData = await res.json();
      applyUpdate(next);
    } catch {
      // 네트워크 실패는 조용히 무시 — 다음 폴링에서 재시도한다.
    }
  }, [fundingId, applyUpdate]);

  useEffect(() => {
    if (data.closed) return; // 마감된 펀딩은 더 이상 폴링할 필요가 없다.

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") fetchNow();
      }, POLL_INTERVAL_MS);
    }
    function stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetchNow();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNow, data.closed]);

  const percentDisplay = useCountUp(data.percent);

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
            {data.contributions.length}명 참여
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
            <ContributeForm fundingId={fundingId} onSuccess={fetchNow} />
          </section>
        )
      )}

      {/* 참여자 목록 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">
          함께한 친구들{" "}
          {data.contributions.length > 0 && `(${data.contributions.length})`}
        </h2>
        {data.contributions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-neutral-400 dark:border-white/20">
            아직 참여한 친구가 없어요. 첫 번째 주인공이 되어주세요!
          </p>
        ) : (
          <ul className="space-y-2">
            {data.contributions.map((c) => (
              <li
                key={c.id}
                className="flex gap-3 rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  {c.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    {isOwner && c.amount !== undefined && (
                      <span className="text-sm font-semibold text-brand-500">
                        {formatKrw(c.amount)}
                      </span>
                    )}
                  </div>
                  {c.message && (
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                      {c.message}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
