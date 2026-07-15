"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FundingLiveData } from "@/app/lib/server/fundings";

const POLL_INTERVAL_MS = 5000;

/**
 * 펀딩 실시간 데이터 폴링 훅 — 펀딩 페이지와 롤링페이퍼 페이지가 공유한다.
 * 탭이 보일 때만 폴링하고, 마감된 펀딩은 폴링하지 않는다.
 * onData는 새 데이터가 state에 반영되기 직전에 호출된다(토스트/컨페티 등 부수효과용).
 */
export function useFundingUpdates(
  fundingId: string,
  initial: FundingLiveData,
  onData?: (next: FundingLiveData) => void,
  view: "funding" | "paper" = "funding",
) {
  const [data, setData] = useState(initial);

  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const fetchNow = useCallback(async () => {
    try {
      const query = view === "paper" ? "?view=paper" : "";
      const res = await fetch(`/api/fundings/${fundingId}/updates${query}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const next: FundingLiveData = await res.json();
      onDataRef.current?.(next);
      setData(next);
    } catch {
      // 네트워크 실패는 조용히 무시 — 다음 폴링에서 재시도한다.
    }
  }, [fundingId, view]);

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

  return { data, fetchNow };
}
