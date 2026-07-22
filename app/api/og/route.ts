import { NextRequest, NextResponse } from "next/server";
import { fetchOg } from "@/app/lib/fetchOg";
import { blockedShopName, withTopicParticle } from "@/app/lib/shopHosts";

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

  // 자동 조회를 막아둔 쇼핑몰에는 요청 자체를 보내지 않는다.
  // 클라이언트도 같은 검사를 하지만, /debug/og 등 다른 호출자도 있어 서버에서 한 번 더 막는다.
  const blocked = blockedShopName(target);
  if (blocked) {
    return NextResponse.json(
      {
        error: `${withTopicParticle(blocked)} 상품 정보를 자동으로 가져올 수 없어요.`,
        blocked: true,
      },
      { status: 422 },
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
