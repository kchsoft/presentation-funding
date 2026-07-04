import { getPlatformStats } from "@/app/lib/server/fundings";
import AnimatedStat from "./AnimatedStat";

export default async function StatsSection() {
  const stats = await getPlatformStats();
  const isEmpty = stats.totalFunded === 0 && stats.fundingCount === 0;

  if (isEmpty) {
    return (
      <p className="text-center text-sm text-neutral-400">
        아직 만들어진 펀딩이 없어요. 당신이 첫 주인공이 되어보세요! 🎉
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div>
        <p className="text-3xl font-bold text-brand-500">
          <AnimatedStat value={stats.totalFunded} format="krw" />
        </p>
        <p className="mt-1 text-xs text-neutral-400">지금까지 모인 마음</p>
      </div>
      <div>
        <p className="text-3xl font-bold text-brand-500">
          <AnimatedStat value={stats.fundingCount} format="count" />
        </p>
        <p className="mt-1 text-xs text-neutral-400">만들어진 펀딩</p>
      </div>
    </div>
  );
}
