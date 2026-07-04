import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/app/lib/server/auth";
import { listMyFundings, totalAmount } from "@/app/lib/server/fundings";
import { daysLeft, formatKrw, progressPercent } from "@/app/lib/format";
import LoginButtons from "@/app/components/LoginButtons";

export const metadata: Metadata = {
  title: "내 펀딩",
};

export default async function MyPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인이 필요해요</h1>
          <p className="text-sm text-neutral-500">
            내 펀딩을 보려면 먼저 로그인해주세요.
          </p>
        </div>
        <LoginButtons />
      </main>
    );
  }

  const fundings = await listMyFundings(session.user.id);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 펀딩</h1>
        <Link
          href="/create"
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          + 새 펀딩
        </Link>
      </div>

      {fundings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-10 text-center text-sm text-neutral-400 dark:border-white/20">
          아직 만든 펀딩이 없어요.
          <br />
          받고 싶은 선물이 있다면 지금 시작해보세요!
        </p>
      ) : (
        <ul className="space-y-3">
          {fundings.map((funding) => {
            const total = totalAmount(funding.contributions);
            const percent = progressPercent(total, funding.goalAmount);
            const dLeft = daysLeft(funding.deadline);
            const closed = funding.deadline < new Date();

            return (
              <li key={funding.id}>
                <Link
                  href={`/f/${funding.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:border-rose-300 dark:border-white/15 dark:bg-neutral-900"
                >
                  {funding.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={funding.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-2xl dark:bg-neutral-800">
                      🎁
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {funding.title}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {formatKrw(total)} 모임 · {funding.contributions.length}명
                      참여 ·{" "}
                      {closed ? "마감됨" : dLeft === 0 ? "오늘 마감" : `D-${dLeft}`}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-rose-500">
                    {percent}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
