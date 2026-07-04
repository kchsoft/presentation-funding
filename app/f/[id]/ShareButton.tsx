"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;

    // 모바일에서는 기기 기본 공유 시트(카카오톡 포함)를 우선 사용한다.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${title} 선물 펀딩 🎁`, url });
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 별도 처리 없이 조용히 둔다.
      }
      return;
    }

    // Web Share API를 지원하지 않는 환경(주로 데스크톱)은 링크 복사로 대체한다.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 권한이 없으면 조용히 무시
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-2.5 text-sm font-semibold text-[#191919] transition hover:brightness-95"
    >
      <Share2 size={16} />
      {copied ? "복사됐어요! 카톡방에 붙여넣으세요 ✓" : "펀딩 링크 공유하기"}
    </button>
  );
}
