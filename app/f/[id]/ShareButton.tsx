"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 권한이 없으면 조용히 무시
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-full rounded-xl bg-[#FEE500] py-2.5 text-sm font-semibold text-[#191919] transition hover:brightness-95"
    >
      {copied ? "복사됐어요! 카톡방에 붙여넣으세요 ✓" : "펀딩 링크 복사하기 🔗"}
    </button>
  );
}
