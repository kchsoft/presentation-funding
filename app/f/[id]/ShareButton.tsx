"use client";

import { useCallback, useState } from "react";
import Script from "next/script";
import { MessageCircle, Share2 } from "lucide-react";

const KAKAO_SDK_URL =
  "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
const KAKAO_SDK_INTEGRITY =
  "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J";

interface KakaoShareLink {
  mobileWebUrl: string;
  webUrl: string;
}

interface KakaoFeedShareOptions {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    link: KakaoShareLink;
  };
  buttons: Array<{
    title: string;
    link: KakaoShareLink;
  }>;
}

interface KakaoSdk {
  init: (javascriptKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (options: KakaoFeedShareOptions) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export default function ShareButton({
  title,
  ownerName,
  imageUrl,
  percent,
}: {
  title: string;
  ownerName: string | null;
  imageUrl: string | null;
  percent: number;
}) {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [kakaoUnavailable, setKakaoUnavailable] = useState(false);
  const kakaoJavaScriptKey =
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();

  const initializeKakao = useCallback(() => {
    const kakao = window.Kakao;
    if (!kakao || !kakaoJavaScriptKey) {
      setKakaoUnavailable(true);
      return;
    }

    try {
      if (!kakao.isInitialized()) kakao.init(kakaoJavaScriptKey);
      setKakaoReady(kakao.isInitialized());
      setKakaoUnavailable(!kakao.isInitialized());
    } catch {
      setKakaoReady(false);
      setKakaoUnavailable(true);
    }
  }, [kakaoJavaScriptKey]);

  function shareToKakao() {
    const kakao = window.Kakao;
    if (!kakao?.isInitialized()) {
      setKakaoUnavailable(true);
      return;
    }

    const url = window.location.href.split("#", 1)[0];
    const link = { mobileWebUrl: url, webUrl: url };

    try {
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `${ownerName ?? "친구"}님의 선물 펀딩 🎁`,
          description: `${title} · ${percent}% 달성! 함께 선물을 완성해주세요.`,
          ...(imageUrl ? { imageUrl } : {}),
          link,
        },
        buttons: [{ title: "펀딩 참여하기", link }],
      });
    } catch {
      setKakaoUnavailable(true);
    }
  }

  async function shareOther() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${title} 선물 펀딩 🎁`,
          text: `${ownerName ?? "친구"}님의 선물 펀딩에 함께해주세요!`,
          url,
        });
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 별도 처리 없이 조용히 둔다.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 권한이 없으면 조용히 무시
    }
  }

  return (
    <div className="space-y-2">
      {kakaoJavaScriptKey && (
        <>
          <Script
            id="kakao-javascript-sdk"
            src={KAKAO_SDK_URL}
            integrity={KAKAO_SDK_INTEGRITY}
            crossOrigin="anonymous"
            strategy="afterInteractive"
            onReady={initializeKakao}
            onError={() => setKakaoUnavailable(true)}
          />
          <button
            type="button"
            onClick={shareToKakao}
            disabled={!kakaoReady || kakaoUnavailable}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-2.5 text-sm font-semibold text-[#191919] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MessageCircle size={16} fill="currentColor" />
            {kakaoUnavailable
              ? "카카오톡 공유를 사용할 수 없어요"
              : kakaoReady
                ? "카카오톡으로 공유"
                : "카카오톡 공유 준비 중…"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={shareOther}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-200 dark:hover:bg-amber-950/30"
      >
        <Share2 size={16} />
        {copied ? "링크가 복사됐어요 ✓" : "다른 앱으로 공유"}
      </button>
    </div>
  );
}
