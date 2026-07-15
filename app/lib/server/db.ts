import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("postgres")) {
  throw new Error(
    "DATABASE_URL에 Supabase PostgreSQL 연결 문자열을 설정해주세요.",
  );
}

// dev 환경에서 HMR로 모듈이 재평가될 때마다 커넥션이 늘어나지 않도록
// globalThis에 싱글턴으로 보관한다.
const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
