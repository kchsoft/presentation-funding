import Link from "next/link";
import { auth } from "@/app/lib/server/auth";
import LoginButtons from "./components/LoginButtons";
import StepsSection from "./components/landing/StepsSection";
import StatsSection from "./components/landing/StatsSection";
import FaqAccordion from "./components/landing/FaqAccordion";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <section className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          혼자는 부담스러운 선물,
          <br />
          친구들과 <span className="text-brand-500">함께 모아서</span>
        </h1>
        <p className="text-lg text-neutral-500">
          20만원짜리 선물도 다섯 명이 모이면 4만원.
          <br />
          링크 하나로 시작하는 생일 선물 펀딩.
        </p>

        <div className="flex justify-center pt-2">
          {session?.user ? (
            <Link
              href="/create"
              className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              펀딩 만들기 →
            </Link>
          ) : (
            <LoginButtons />
          )}
        </div>
      </section>

      <StepsSection />

      <section className="mt-16 w-full max-w-3xl">
        <StatsSection />
      </section>

      <section className="mt-16 w-full max-w-2xl space-y-4">
        <h2 className="text-center text-lg font-semibold">
          자주 묻는 질문
        </h2>
        <FaqAccordion />
      </section>

      <footer className="mt-20 text-center text-xs text-neutral-400">
        선물모아 — 실제 송금은 친구에게 직접 전달돼요.
      </footer>
    </main>
  );
}
