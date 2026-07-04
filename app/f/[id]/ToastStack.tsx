"use client";

import { motion, AnimatePresence } from "motion/react";

export interface ToastItem {
  id: string;
  text: string;
}

/**
 * 이 페이지 하나에서만 쓰이는 토스트라 전역 Context 없이
 * 부모(FundingLive)가 소유한 로컬 state를 그대로 받아 렌더링만 한다.
 */
export default function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-xs -translate-x-1/2 flex-col gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-neutral-900/90 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur dark:bg-white/90 dark:text-neutral-900"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
