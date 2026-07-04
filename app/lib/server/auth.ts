import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

/**
 * 카카오 앱 키가 아직 없는 로컬 환경에서만 노출되는 개발용 로그인.
 * AUTH_KAKAO_ID를 설정하는 순간 자동으로 사라진다.
 */
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && !process.env.AUTH_KAKAO_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials(개발용 로그인) 프로바이더는 DB 세션을 지원하지 않으므로 JWT 세션을 쓴다.
  session: { strategy: "jwt" },
  providers: [
    Kakao,
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev-login",
            name: "개발용 로그인",
            credentials: {},
            async authorize() {
              return prisma.user.upsert({
                where: { email: "dev@localhost" },
                update: {},
                create: { email: "dev@localhost", name: "개발자" },
              });
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
