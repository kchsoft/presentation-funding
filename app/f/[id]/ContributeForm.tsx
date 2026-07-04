"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { HeartHandshake } from "lucide-react";
import { contributeAction, type ActionState } from "@/app/actions/funding";
import { useOnActionSuccess } from "@/app/lib/hooks/useOnActionSuccess";

const PRESET_AMOUNTS = [10000, 20000, 30000, 50000];

export default function ContributeForm({
  fundingId,
  onSuccess,
}: {
  fundingId: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    contributeAction,
    null,
  );

  useOnActionSuccess(state, onSuccess);

  if (state?.success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-5 text-center text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        🎉 마음이 잘 전달됐어요. 참여해줘서 고마워요!
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
