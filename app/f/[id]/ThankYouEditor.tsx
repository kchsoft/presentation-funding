"use client";

import { useActionState, useState } from "react";
import {
  updateThankYouMessageAction,
  type ActionState,
} from "@/app/actions/funding";
import { useOnActionSuccess } from "@/app/lib/hooks/useOnActionSuccess";

const MAX_LENGTH = 200;

export default function ThankYouEditor({
  fundingId,
  initialMessage,
  onSuccess,
}: {
  fundingId: string;
  initialMessage: string | null;
  onSuccess?: () => void;
}) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateThankYouMessageAction,
    null,
  );

  useOnActionSuccess(state, onSuccess);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="fundingId" value={fundingId} />
      <label
        htmlFor="thankYouMessage"
        className="text-xs font-medium text-amber-900 dark:text-amber-200"
      >
        친구들에게 남기는 감사 메시지 (전체 공개)
      </label>
      <textarea
        id="thankYouMessage"
        name="thankYouMessage"
        rows={2}
        maxLength={MAX_LENGTH}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="다들 고마워요! 덕분에 좋은 선물 받을 수 있게 됐어요 :)"
        className="w-full resize-none rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-amber-800 dark:bg-neutral-900"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-700/70 dark:text-amber-300/70">
          {message.length}/{MAX_LENGTH}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          저장됐어요 ✓
        </p>
      )}
    </form>
  );
}
