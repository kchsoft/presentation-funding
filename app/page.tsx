import Link from "next/link";
import { auth } from "@/app/lib/server/auth";
import LoginButtons from "./components/LoginButtons";

const STEPS = [
  {
    emoji: "🔗",
    title: "받고 싶은 선물 등록",
    body: "상품 링크를 붙여넣으면 이미지와 이름을 자동으로 가져와요. 목표 금액과 마감일만 정하면 끝.",
  },
  {
    emoji: "💬",
    title: "친구들에게 공유",
    body: "펀딩 링크를 카톡방에 공유하세요. 친구들은 로그인 없이 바로 참여할 수 있어요.",
  },
  {
    emoji: "🎉",
    title: "함께 완성하는 선물",
    body: "각자 원하는 만큼 마음을 보태요. 누가 얼마를 냈는지는 서로에게 보이지 않아요.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <section className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          혼자는 부담스러운 선물,
          <br />
          친구들과 <span className="text-rose-500">함께 모아서</span>
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
              className="rounded-xl bg-rose-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              펀딩 만들기 →
            </Link>
          ) : (
            <LoginButtons />
          )}
        </div>
      </section>

      <section className="mt-24 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900"
          >
            <div className="text-3xl">{step.emoji}</div>
            <h2 className="mt-3 font-semibold">
              {i + 1}. {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              {step.body}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
