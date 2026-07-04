import Link from "next/link";
import { auth } from "@/app/lib/server/auth";
import { signOutAction } from "@/app/actions/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-black/5 dark:border-white/10">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          🎁 선물모아
        </Link>

        {session?.user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/create"
              className="font-medium text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
            >
              펀딩 만들기
            </Link>
            <Link
              href="/me"
              className="font-medium text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
            >
              내 펀딩
            </Link>
            <span className="hidden text-neutral-400 sm:inline">
              {session.user.name}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-black/10 px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-50 dark:border-white/15 dark:hover:bg-neutral-800"
              >
                로그아웃
              </button>
            </form>
          </nav>
        ) : (
          <span className="text-xs text-neutral-400">
            함께 모아 선물하는 가장 쉬운 방법
          </span>
        )}
      </div>
    </header>
  );
}
