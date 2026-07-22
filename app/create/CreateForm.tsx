"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { createFundingAction, type ActionState } from "@/app/actions/funding";
import { createSchema } from "@/app/lib/validation/funding";
import { formatKrw } from "@/app/lib/format";
import type { OgResult } from "@/app/lib/types";
import { blockedShopName, withTopicParticle } from "@/app/lib/shopHosts";

const SPLIT_COUNTS = [2, 3, 5, 10];
const STEP_LABELS = ["링크", "정보", "확인"];

/** 붙여넣기/타이핑이 멈춘 뒤 이만큼 기다렸다가 OG를 가져온다. */
const OG_DEBOUNCE_MS = 500;

/** 자동 조회를 시도할 만한 URL인지. 스킴이 없으면 아직 입력 중으로 본다. */
function isFetchableUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

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

  // 자동 조회 상태. 렌더와 무관한 값이라 ref로만 들고 있는다.
  //  - fetchedUrl: 이미 조회한 URL (같은 URL을 반복 조회하지 않게)
  //  - abort: 진행 중인 요청 (URL이 또 바뀌면 취소해서 늦게 온 응답이 덮어쓰지 못하게)
  //  - autoTitle/autoGoal: 마지막으로 "자동으로" 채워 넣은 값.
  //    사용자가 직접 고친 값은 다음 조회에서 덮어쓰지 않기 위한 기준점이다.
  const fetchedUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoRef = useRef({ title: "", goal: "" });

  // 프리필 판단에 쓸 최신 입력값. loadOg를 stable하게 유지하려고 ref로 미러링한다.
  const inputRef = useRef({ title, goalAmount });
  useEffect(() => {
    inputRef.current = { title, goalAmount };
  }, [title, goalAmount]);

  const loadOg = useCallback(async (target: string) => {
    const value = target.trim();
    if (!value) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchedUrlRef.current = value;

    setOgLoading(true);
    setOgError(null);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(value)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        setOgError(json.error ?? "상품 정보를 가져오지 못했어요.");
        setOg(null);
        return;
      }
      const data = json as OgResult;
      setOg(data);

      const auto = autoRef.current;
      const input = inputRef.current;

      // 비어 있거나 이전 자동 프리필 값 그대로일 때만 덮어쓴다.
      // 사용자가 손댄 값은 링크를 바꿔도 유지된다.
      if (data.title && (!input.title || input.title === auto.title)) {
        setTitle(data.title);
        auto.title = data.title;
        input.title = data.title;
      }
      // OG에 가격이 있으면 목표 금액으로 프리필 (원화 정수만)
      const price = Number(data.price);
      if (
        Number.isInteger(price) &&
        price > 0 &&
        (!input.goalAmount || input.goalAmount === auto.goal)
      ) {
        setGoalAmount(String(price));
        auto.goal = String(price);
        input.goalAmount = String(price);
      }
    } catch (e) {
      // 취소된 요청은 사용자가 링크를 더 입력한 것뿐이므로 조용히 무시한다.
      if (e instanceof DOMException && e.name === "AbortError") return;
      setOgError("네트워크 오류가 발생했어요.");
      setOg(null);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setOgLoading(false);
      }
    }
  }, []);

  // 링크를 붙여넣거나 입력이 멈추면 자동으로 상품 정보를 가져온다.
  useEffect(() => {
    const value = productUrl.trim();
    if (!isFetchableUrl(value) || value === fetchedUrlRef.current) return;

    // 자동 조회를 막아둔 쇼핑몰은 요청 자체를 보내지 않는다.
    // 어차피 실패할 요청에 몇 초씩 기다리게 할 이유가 없다.
    // 안내 문구는 렌더 중 blockedShop으로 파생시킨다(여기서 setState하지 않는다).
    if (blockedShopName(value)) return;

    const timer = setTimeout(() => void loadOg(value), OG_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [productUrl, loadOg]);

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

  // 자동 조회가 막힌 쇼핑몰인지는 상태가 아니라 입력값에서 파생시킨다.
  // 링크를 바꾸면 즉시 반영되고, 이전 링크의 조회 결과가 남아 새 상품에 섞이지 않는다.
  const blockedShop = blockedShopName(productUrl.trim());
  const effectiveOg = blockedShop ? null : og;
  const image = effectiveOg?.images[0]?.url ?? null;
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
        <input
          id="productUrl"
          name="productUrl"
          type="text"
          inputMode="url"
          required
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://... 받고 싶은 상품 링크를 붙여넣으세요"
          className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
        />
        {ogLoading ? (
          <p className="text-xs text-neutral-400">상품 정보를 불러오는 중…</p>
        ) : (
          !effectiveOg &&
          !ogError &&
          !blockedShop && (
            <p className="text-xs text-neutral-400">
              링크를 붙여넣으면 상품 정보를 자동으로 가져와요.
            </p>
          )
        )}

        {/* 조회가 안 되는 건 사용자 잘못이 아니다. 경고색 대신 담담한 안내로 보여주고,
            어느 쪽이든 "다음"으로 그냥 진행할 수 있다는 걸 분명히 한다. */}
        {blockedShop && (
          <p className="rounded-lg bg-neutral-100 p-3 text-xs leading-relaxed text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {withTopicParticle(blockedShop)} 상품 정보를 자동으로 가져올 수
            없어요. 다음 단계에서 직접 입력해주세요.
          </p>
        )}
        {ogError && !blockedShop && (
          <div className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
            <p className="flex-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {ogError} 직접 입력해도 괜찮아요.
            </p>
            <button
              type="button"
              onClick={() => void loadOg(productUrl)}
              className="shrink-0 rounded-lg border border-black/15 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-white dark:border-white/20 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {ogLoading && (
          <div className="h-32 w-full animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        )}

        {effectiveOg && !ogLoading && (
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
                {effectiveOg.title || "(제목 없음)"}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">{effectiveOg.siteName}</p>
            </div>
          </div>
        )}
      </section>

      {/* OG에서 가져온 값은 hidden으로 함께 제출 */}
      <input type="hidden" name="imageUrl" value={image ?? ""} />
      <input type="hidden" name="siteName" value={effectiveOg?.siteName ?? ""} />

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
            // 1단계에서 조회 중에 넘어가면 프리필이 반영되기 전 화면을 보게 된다.
            disabled={step === 1 && ogLoading}
            className={`w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 ${
              step === 3 ? "invisible" : ""
            }`}
          >
            {step === 1 && ogLoading ? "불러오는 중…" : "다음"}
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
