"use client";

import { useState } from "react";
import type { OgResult } from "@/app/lib/types";
import OgCard from "./OgCard";

const EXAMPLES = [
  "https://www.coupang.com",
  "https://smartstore.naver.com",
];

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OgResult | null>(null);

  async function submit(target: string) {
    const value = target.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(value)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "요청에 실패했습니다.");
      } else {
        setData(json as OgResult);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(url);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="상품 URL을 붙여넣으세요 (쿠팡, 스마트스토어 등)"
          className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "불러오는 중…" : "미리보기"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
        예시:
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setUrl(ex);
              submit(ex);
            }}
            className="underline underline-offset-2 hover:text-blue-600"
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && (
        <div className="h-64 w-full animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {data && !loading && <OgCard data={data} />}
    </div>
  );
}
