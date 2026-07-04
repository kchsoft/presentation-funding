import { NextResponse } from "next/server";
import { auth } from "@/app/lib/server/auth";
import { getFunding, toLiveViewModel } from "@/app/lib/server/fundings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  // 매 요청마다 새로 조회 + isOwner를 서버에서 재계산한다.
  // 클라이언트가 보낸 값은 절대 신뢰하지 않는다 — 이게 금액 비공개의 유일한 방어선.
  const [funding, session] = await Promise.all([getFunding(id), auth()]);

  if (!funding) {
    return NextResponse.json({ error: "펀딩을 찾을 수 없어요." }, { status: 404 });
  }

  const isOwner = session?.user?.id === funding.owner.id;
  return NextResponse.json(toLiveViewModel(funding, isOwner));
}
