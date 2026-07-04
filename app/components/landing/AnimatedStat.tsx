"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { useCountUp } from "@/app/lib/hooks/useCountUp";
import { formatKrw } from "@/app/lib/format";

// 함수는 서버→클라이언트 컴포넌트 경계를 건널 수 없으므로(직렬화 불가),
// prop으로는 문자열 종류만 받고 실제 포맷 함수는 클라이언트 쪽에서 고른다.
const FORMATTERS = {
  krw: formatKrw,
  count: (n: number) => `${n}개`,
} as const;

export default function AnimatedStat({
  value,
  format,
}: {
  value: number;
  format?: keyof typeof FORMATTERS;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const display = useCountUp(inView ? value : 0, 900);
  const formatted = format ? FORMATTERS[format](display) : display;

  return <span ref={ref}>{formatted}</span>;
}
