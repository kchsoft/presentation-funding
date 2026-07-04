import { devLoginEnabled } from "@/app/lib/server/auth";
import { signInDev, signInWithKakao } from "@/app/actions/auth";

/** 카카오 로그인 버튼 (+ 카카오 키가 없는 로컬에서는 개발용 로그인). */
export default function LoginButtons() {
  return (
    <div className="flex flex-col items-center gap-2">
      <form action={signInWithKakao}>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-[#FEE500] px-6 py-3 text-sm font-semibold text-[#191919] transition hover:brightness-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#191919"
              d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.26 4.66 6.65l-1.19 4.4c-.1.39.34.7.68.47l5.23-3.47c.2.01.41.02.62.02 5.52 0 10-3.54 10-7.9S17.52 3 12 3z"
            />
          </svg>
          카카오로 시작하기
        </button>
      </form>

      {devLoginEnabled && (
        <form action={signInDev}>
          <button
            type="submit"
            className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
          >
            개발용 로그인 (카카오 키 설정 전)
          </button>
        </form>
      )}
    </div>
  );
}
