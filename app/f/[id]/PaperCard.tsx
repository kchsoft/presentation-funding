"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import {
  deleteContributionMessageAction,
  editContributionMessageAction,
  toggleCardHiddenAction,
} from "@/app/actions/funding";
import { useOnActionSuccess } from "@/app/lib/hooks/useOnActionSuccess";
import type { LiveContribution } from "@/app/lib/server/fundings";
import { formatKrw } from "@/app/lib/format";

// 카드 배경 프리셋 — 카드 id 해시로 결정해 같은 카드는 언제나 같은 색을 갖는다.
// (참여자가 직접 고르는 "카드 꾸미기"는 Should 범위 — 이건 표시용 기본값이다.)
const CARD_STYLES = [
  "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
  "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40",
  "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
  "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
];

export function cardStyle(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_STYLES[h % CARD_STYLES.length];
}

/**
 * 롤링페이퍼 카드 한 장. 메시지가 있으면 메시지 카드, 없으면 이름 카드.
 * - editToken이 있고 마감 전이면(작성 브라우저) 수정·삭제 가능
 * - isOwner면 숨김/해제 가능 (hidden=true는 주인공의 숨긴 카드 목록에서 렌더될 때)
 */
export default function PaperCard({
  fundingId,
  contribution: c,
  editToken,
  closed,
  isOwner = false,
  showAmount = false,
  hidden = false,
  onChanged,
}: {
  fundingId: string;
  contribution: LiveContribution;
  editToken?: string;
  closed: boolean;
  isOwner?: boolean;
  showAmount?: boolean;
  hidden?: boolean;
  onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [editState, editAction, editPending] = useActionState(
    editContributionMessageAction,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteContributionMessageAction,
    null,
  );
  const [hideState, hideAction, hidePending] = useActionState(
    toggleCardHiddenAction,
    null,
  );

  useOnActionSuccess(editState, () => {
    setEditing(false);
    onChanged?.();
  });
  useOnActionSuccess(deleteState, () => {
    setConfirmingDelete(false);
    onChanged?.();
  });
  useOnActionSuccess(hideState, onChanged);

  const isMine = !!editToken;
  const canEdit = isMine && !closed;
  const error = editState?.error ?? deleteState?.error ?? hideState?.error;

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-sm ${cardStyle(c.id)} ${hidden ? "opacity-60" : ""}`}
    >
      {c.message ? (
        <>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {c.message}
          </p>
          <p className="text-xs font-medium text-neutral-500">— {c.name}</p>
        </>
      ) : (
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {c.name}
          </span>
          님이 마음을 보탰어요 💛
        </p>
      )}

      {showAmount && c.amount !== undefined && (
        <p className="text-xs font-semibold text-brand-500">
          {formatKrw(c.amount)} (나에게만 보여요)
        </p>
      )}

      {/* 인라인 수정 폼 — 작성 브라우저에서만 열린다. 서버가 editToken을 재검증한다. */}
      {editing && (
        <form action={editAction} className="space-y-2">
          <input type="hidden" name="fundingId" value={fundingId} />
          <input type="hidden" name="contributionId" value={c.id} />
          <input type="hidden" name="editToken" value={editToken} />
          <textarea
            name="message"
            rows={3}
            maxLength={200}
            required
            defaultValue={c.message ?? ""}
            autoFocus
            className="w-full resize-none rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/20 dark:bg-neutral-900"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={editPending}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {editPending ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-neutral-600 dark:border-white/15 dark:text-neutral-300"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 삭제 확인 — 메시지만 지워지고 이름 카드는 남는다. */}
      {confirmingDelete && (
        <form action={deleteAction} className="space-y-2">
          <input type="hidden" name="fundingId" value={fundingId} />
          <input type="hidden" name="contributionId" value={c.id} />
          <input type="hidden" name="editToken" value={editToken} />
          <p className="text-xs text-neutral-500">
            메시지만 지워지고, 참여 기록(이름 카드)은 남아요.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={deletePending}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deletePending ? "지우는 중…" : "메시지 지우기"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-neutral-600 dark:border-white/15 dark:text-neutral-300"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* 액션 줄 — 편집/삭제 확인 중에는 숨긴다. */}
      {!editing && !confirmingDelete && (canEdit || isOwner) && (
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <Pencil size={12} />
              {c.message ? "수정" : "메시지 쓰기"}
            </button>
          )}
          {canEdit && c.message && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1 hover:text-red-500"
            >
              <Trash2 size={12} />
              삭제
            </button>
          )}
          {isOwner && (
            <form action={hideAction} className="ml-auto">
              <input type="hidden" name="fundingId" value={fundingId} />
              <input type="hidden" name="contributionId" value={c.id} />
              <input type="hidden" name="hidden" value={hidden ? "0" : "1"} />
              <button
                type="submit"
                disabled={hidePending}
                className="flex items-center gap-1 hover:text-neutral-600 disabled:opacity-50 dark:hover:text-neutral-200"
              >
                {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                {hidden ? "다시 보이기" : "숨기기"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
