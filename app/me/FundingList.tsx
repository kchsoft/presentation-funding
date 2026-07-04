"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Gift } from "lucide-react";
import { formatKrw } from "@/app/lib/format";

export interface FundingListItemData {
  id: string;
  title: string;
  imageUrl: string | null;
  total: number;
  percent: number;
  contributionCount: number;
  dLeft: number;
  closed: boolean;
}

export default function FundingList({ items }: { items: FundingListItemData[] }) {
  return (
    <ul className="space-y-3">
      {items.map((funding, i) => (
        <motion.li
          key={funding.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
        >
          <Link
            href={`/f/${funding.id}`}
            className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:border-brand-300 dark:border-white/15 dark:bg-neutral-900"
          >
            {funding.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={funding.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-950/40">
                <Gift size={22} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{funding.title}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {formatKrw(funding.total)} 모임 · {funding.contributionCount}명
                참여 ·{" "}
                {funding.closed
                  ? "마감됨"
                  : funding.dLeft === 0
                    ? "오늘 마감"
                    : `D-${funding.dLeft}`}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${funding.percent}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-brand-500">
              {funding.percent}%
            </span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
