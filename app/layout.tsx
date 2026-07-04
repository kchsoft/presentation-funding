import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import { noFlashThemeScript } from "./lib/theme";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: {
    default: "선물모아 — 함께 모아 선물하기",
    template: "%s | 선물모아",
  },
  description:
    "혼자 사기엔 부담스러운 선물, 친구들과 함께 모아서 선물하세요. 링크 하나로 시작하는 선물 펀딩.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // 하이드레이션 전에 다크모드 클래스를 미리 적용해 깜빡임을 막는다.
          dangerouslySetInnerHTML={{ __html: noFlashThemeScript }}
        />
        {/* JS가 실행되지 않는 환경(비활성화, 스크립트 차단 CSP 등)에서는
            위 인라인 스크립트가 .dark 클래스를 설정할 수 없으므로,
            <noscript>로 시스템 다크 모드 설정에 대한 최소한의 폴백을 둔다. */}
        <noscript>
          <style>{`@media (prefers-color-scheme: dark) {
            :root:not(.light) {
              --background: #0a0a0a;
              --foreground: #ededed;
              --surface: #171717;
              --surface-muted: #1f1f1f;
              --border-subtle: rgb(255 255 255 / 0.12);
            }
          }`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
