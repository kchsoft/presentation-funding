"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { HeartHandshake } from "lucide-react";
import { contributeAction, type ContributeState } from "@/app/actions/funding";
import { useOnActionSuccess } from "@/app/lib/hooks/useOnActionSuccess";
import { saveEditToken } from "@/app/lib/paperTokens";

const PRESET_AMOUNTS = [10000, 20000, 30000, 50000];

export default function ContributeForm({
  fundingId,
  ownerName,
  onSuccess,
}: {
  fundingId: string;
  ownerName: string | null;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ContributeState, FormData>(
    contributeAction,
    null,
  );

  useOnActionSuccess(state, onSuccess);

  // 참여 성공 시 발급된 editToken을 이 브라우저에 저장한다 —
  // 마감 전까지 같은 브라우저에서만 내 카드 메시지를 수정·삭제할 수 있다.
  useEffect(() => {
    if (state?.success) {
      saveEditToken(fundingId, state.contributionId, state.editToken);
    }
  }, [state, fundingId]);

  if (state?.success) {
    return (
      <div className="space-y-3 rounded-xl bg-emerald-50 p-5 text-center text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        <p>🎉 마음이 잘 전달됐어요. 참여해줘서 고마워요!</p>
        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
          내 카드가 롤링페이퍼에 실렸어요. 마감 전까지 이 브라우저에서 메시지를
          고칠 수 있어요.
        </p>
        <Link
          href={`/f/${fundingId}/paper`}
          className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          💌 롤링페이퍼 보러 가기
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="fundingId" value={fundingId} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={20}
          placeholder="친구가 알아볼 수 있는 이름"
          className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-medium">
          금액 (원)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          required
          min={1000}
          step={1000}
          placeholder="40000"
          className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
        />
        <div className="flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const input = document.getElementById(
                  "amount",
                ) as HTMLInputElement;
                input.value = String(amount);
              }}
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {new Intl.NumberFormat("ko-KR").format(amount)}원
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-neutral-400">
          금액은 다른 친구들에게 보이지 않아요.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="contribute-message" className="text-sm font-medium">
          축하 메시지 <span className="font-normal text-neutral-400">(선택)</span>
        </label>
        <textarea
          id="contribute-message"
          name="message"
          rows={2}
          maxLength={200}
          placeholder="생일 축하해! 🎂"
          className="w-full resize-none rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
        />
        <p className="text-xs text-brand-500">
          💌 이 메시지는 {ownerName ?? "친구"}님의 롤링페이퍼에 카드로 실려요.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? (
          "보내는 중…"
        ) : (
          <>
            <HeartHandshake size={16} />
            마음 보태기
          </>
        )}
      </button>
    </form>
  );
}
