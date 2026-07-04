"use client";

import { useActionState, useState } from "react";
import { createFundingAction, type ActionState } from "@/app/actions/funding";
import type { OgResult } from "@/app/lib/types";

/** 로컬 타임존 기준 오늘 날짜 (YYYY-MM-DD). date input의 min 값으로 쓴다. */
function todayString() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function CreateForm() {
  const [productUrl, setProductUrl] = useState("");
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);
  const [og, setOg] = useState<OgResult | null>(null);

  const [title, setTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createFundingAction,
    null,
  );

  async function loadOg() {
    const value = productUrl.trim();
    if (!value) return;

    setOgLoading(true);
    setOgError(null);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(value)}`);
      const json = await res.json();
      if (!res.ok) {
        setOgError(json.error ?? "상품 정보를 가져오지 못했어요.");
        setOg(null);
        return;
      }
      const data = json as OgResult;
      setOg(data);
      if (data.title) setTitle(data.title);
      // OG에 가격이 있으면 목표 금액으로 프리필 (원화 정수만)
      const price = Number(data.price);
      if (Number.isInteger(price) && price > 0) setGoalAmount(String(price));
    } catch {
      setOgError("네트워크 오류가 발생했어요.");
      setOg(null);
    } finally {
      setOgLoading(false);
    }
  }

  const image = og?.images[0]?.url ?? null;

  return (
    <form action={formAction} className="space-y-8">
      {/* 1. 상품 링크 */}
      <section className="space-y-2">
        <label htmlFor="productUrl" className="text-sm font-semibold">
          상품 링크
        </label>
        <div className="flex gap-2">
          <input
            id="productUrl"
            name="productUrl"
            type="text"
            inputMode="url"
            required
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://... 받고 싶은 상품 링크를 붙여넣으세요"
            className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-white/20 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={loadOg}
            disabled={ogLoading || !productUrl.trim()}
            className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/20 dark:hover:bg-neutral-800"
          >
            {ogLoading ? "불러오는 중…" : "정보 가져오기"}
          </button>
        </div>
        {ogError && <p className="text-sm text-red-600">{ogError}</p>}

        {ogLoading && (
          <div className="h-32 w-full animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        )}

        {og && !ogLoading && (
          <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-neutral-900">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="h-20 w-20 shrink-0 rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-2xl dark:bg-neutral-800">
                🎁
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {og.title || "(제목 없음)"}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">{og.siteName}</p>
            </div>
          </div>
        )}
      </section>

      {/* OG에서 가져온 값은 hidden으로 함께 제출 */}
      <input type="hidden" name="imageUrl" value={image ?? ""} />
      <input type="hidden" name="siteName" value={og?.siteName ?? ""} />

      {/* 2. 펀딩 정보 */}
      <section className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold">
            선물 이름
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 에어팟 프로 2세대"
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-white/20 dark:bg-neutral-900"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="goalAmount" className="text-sm font-semibold">
            목표 금액 (원)
          </label>
          <input
            id="goalAmount"
            name="goalAmount"
            type="number"
            required
            min={1000}
            step={1000}
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="200000"
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-white/20 dark:bg-neutral-900"
          />
          <p className="text-xs text-neutral-400">
            상품 가격을 그대로 써도 되고, 원하는 만큼 정해도 돼요.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="deadline" className="text-sm font-semibold">
            마감일
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            required
            min={todayString()}
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-white/20 dark:bg-neutral-900"
          />
          <p className="text-xs text-neutral-400">
            보통 생일 당일로 정해요. 마감일까지 참여할 수 있어요.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-semibold">
            친구들에게 한마디 <span className="font-normal text-neutral-400">(선택)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            maxLength={300}
            placeholder="예) 곧 내 생일인데, 이거 진짜 갖고 싶었어! 부담 없이 마음만 보태줘 🙏"
            className="w-full resize-none rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-white/20 dark:bg-neutral-900"
          />
        </div>
      </section>

      {state?.error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
      >
        {pending ? "만드는 중…" : "펀딩 만들기"}
      </button>
    </form>
  );
}
