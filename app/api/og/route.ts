import { NextRequest, NextResponse } from "next/server";
import { fetchOg } from "@/app/lib/fetchOg";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json(
      { error: "url 쿼리 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json(
      { error: "올바른 URL 형식이 아닙니다." },
      { status: 400 },
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "http 또는 https URL만 지원합니다." },
      { status: 400 },
    );
  }

  try {
    const data = await fetchOg(target);
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
