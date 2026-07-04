"use client";

import { useActionState, useState } from "react";
import { Gift } from "lucide-react";
import { createFundingAction, type ActionState } from "@/app/actions/funding";
import { createSchema } from "@/app/lib/validation/funding";
import { formatKrw } from "@/app/lib/format";
import type { OgResult } from "@/app/lib/types";

const SPLIT_COUNTS = [2, 3, 5, 10];
const STEP_LABELS = ["링크", "정보", "확인"];

/** 로컬 타임존 기준 오늘 날짜 (YYYY-MM-DD). date input의 min 값으로 쓴다. */
function todayString() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function CreateForm() {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const [productUrl, setProductUrl] = useState("");
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);
  const [og, setOg] = useState<OgResult | null>(null);

  const [title, setTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");

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

  function goNext() {
    if (step === 1) {
      const parsed = createSchema
        .pick({ productUrl: true })
        .safeParse({ productUrl });
      if (!parsed.success) {
        setStepError(parsed.error.issues[0]?.message ?? "링크를 확인해주세요.");
        return;
      }
    }
    if (step === 2) {
      const parsed = createSchema
        .pick({ title: true, goalAmount: true, deadline: true, message: true })
        .safeParse({ title, goalAmount, deadline, message });
      if (!parsed.success) {
        setStepError(
          parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
        );
        return;
      }
    }
    setStepError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  const image = og?.images[0]?.url ?? null;
  const goalNumber = Number(goalAmount);
  const hasValidGoal = Number.isFinite(goalNumber) && goalNumber > 0;

  return (
    <form action={formAction} className="space-y-6">
      {/* 단계 표시 */}
      <div className="flex items-center justify-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition ${
                  active
                    ? "bg-brand-500 text-white"
                    : done
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                      : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                }`}
              >
                {n}
              </div>
              <span
                className={`text-xs ${active ? "font-semibold" : "text-neutral-400"}`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className="h-px w-6 bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* 1단계: 링크 */}
      <section className={step === 1 ? "space-y-2" : "hidden space-y-2"}>
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
            className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
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
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-950/40">
                <Gift size={24} />
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

      {/* 2단계: 펀딩 정보 */}
      <section className={step === 2 ? "space-y-5" : "hidden space-y-5"}>
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
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
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
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
          />
          {hasValidGoal ? (
            <p className="text-xs text-neutral-400">
              {SPLIT_COUNTS.map((n, i) => (
                <span key={n}>
                  {i > 0 && " · "}
                  친구 {n}명이면{" "}
                  <span className="font-medium text-neutral-500">
                    {formatKrw(Math.ceil(goalNumber / n))}
                  </span>
                </span>
              ))}
            </p>
          ) : (
            <p className="text-xs text-neutral-400">
              상품 가격을 그대로 써도 되고, 원하는 만큼 정해도 돼요.
            </p>
          )}
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
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
          />
          <p className="text-xs text-neutral-400">
            보통 생일 당일로 정해요. 마감일까지 참여할 수 있어요.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-semibold">
            친구들에게 한마디{" "}
            <span className="font-normal text-neutral-400">(선택)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예) 곧 내 생일인데, 이거 진짜 갖고 싶었어! 부담 없이 마음만 보태줘 🙏"
            className="w-full resize-none rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
          />
          <p className="text-right text-xs text-neutral-400">
            {message.length}/300
          </p>
        </div>
      </section>

      {/* 3단계: 확인 */}
      <section className={step === 3 ? "space-y-4" : "hidden space-y-4"}>
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-neutral-900">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-40 w-full bg-neutral-100 object-cover dark:bg-neutral-800"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-brand-500 dark:from-brand-950/40 dark:to-brand-900/30">
              <Gift size={32} />
            </div>
          )}
          <div className="space-y-2 p-4">
            <h3 className="font-semibold">{title || "(제목 없음)"}</h3>
            <p className="text-sm text-neutral-500">
              목표 {hasValidGoal ? formatKrw(goalNumber) : "-"} · 마감{" "}
              {deadline || "-"}
            </p>
            {message && (
              <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
                💌 {message}
              </p>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-neutral-400">
          이 내용으로 펀딩 링크를 만들고 친구들에게 공유할 수 있어요.
        </p>
      </section>

      {stepError && <p className="text-sm text-red-600">{stepError}</p>}
      {state?.error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* 하단 내비게이션 — 버튼들을 항상 마운트해두고 상태만 바꾼다.
          조건부로 마운트/언마운트하면 형제 엘리먼트의 위치가 밀리면서
          key 없는 React 리컨실리에이션이 엉뚱한 노드를 재사용해
          클릭이 씹히는 경우가 있다(실제 사용자에게도 위험한 버그).
          "다음"/"제출" 버튼은 절대 하나의 엘리먼트로 합치지 않는다 — type을
          button→submit으로 바꾸는 도중 클릭 이벤트가 겹치면 의도치 않게
          폼이 제출될 수 있어서, 겹쳐 그리는 두 개의 독립된 엘리먼트로 분리한다. */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className={`flex-1 rounded-xl border border-black/15 py-3 text-sm font-medium transition hover:bg-neutral-50 dark:border-white/20 dark:hover:bg-neutral-800 ${
            step === 1 ? "invisible" : ""
          }`}
        >
          이전
        </button>
        <div className="relative flex-1">
          <button
            type="button"
            onClick={goNext}
            tabIndex={step === 3 ? -1 : 0}
            aria-hidden={step === 3}
            className={`w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 ${
              step === 3 ? "invisible" : ""
            }`}
          >
            다음
          </button>
          <button
            type="submit"
            disabled={step !== 3 || pending}
            tabIndex={step === 3 ? 0 : -1}
            aria-hidden={step !== 3}
            className={`absolute inset-0 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 ${
              step === 3 ? "" : "invisible"
            }`}
          >
            {pending ? "만드는 중…" : "펀딩 만들기"}
          </button>
        </div>
      </div>
    </form>
  );
}
