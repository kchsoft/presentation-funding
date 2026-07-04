"use client";

import { useEffect, useRef, useState } from "react";

/** value가 바뀔 때마다 이전 값에서 새 값까지 부드럽게 세어 올라가는 숫자를 반환한다. */
export function useCountUp(value: number, duration = 600): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // 애니메이션이 끝까지 가지 못하고 중간에 중단되면(value가 또 바뀜),
      // 다음 애니메이션은 화면에 마지막으로 보였던 값에서 이어져야 한다 —
      // 그러지 않으면 오래된 fromRef로 되돌아가 숫자가 잠깐 역행해 보인다.
      fromRef.current = displayRef.current;
    };
  }, [value, duration]);

  return display;
}
