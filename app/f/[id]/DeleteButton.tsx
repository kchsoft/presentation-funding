"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteFundingAction } from "@/app/actions/funding";

export default function DeleteButton({ fundingId }: { fundingId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600"
      >
        <Trash2 size={12} />
        펀딩 삭제
      </button>
    );
  }

  return (
    <form action={deleteFundingAction} className="flex items-center gap-2">
      <input type="hidden" name="fundingId" value={fundingId} />
      <span className="text-xs text-red-600">참여 기록도 함께 지워져요.</span>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        삭제 확인
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs text-neutral-400 hover:text-neutral-600"
      >
        취소
      </button>
    </form>
  );
}
