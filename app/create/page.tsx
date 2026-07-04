import type { Metadata } from "next";
import { auth } from "@/app/lib/server/auth";
import LoginButtons from "@/app/components/LoginButtons";
import CreateForm from "./CreateForm";

export const metadata: Metadata = {
  title: "펀딩 만들기",
};

export default async function CreatePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인이 필요해요</h1>
          <p className="text-sm text-neutral-500">
            펀딩을 만들려면 먼저 로그인해주세요.
          </p>
        </div>
        <LoginButtons />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">펀딩 만들기</h1>
        <p className="text-sm text-neutral-500">
          받고 싶은 선물의 링크를 붙여넣는 것부터 시작해요.
        </p>
      </div>
      <CreateForm />
    </main>
  );
}
