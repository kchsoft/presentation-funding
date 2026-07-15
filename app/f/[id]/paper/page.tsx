import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/app/lib/server/auth";
import { getFunding, toLiveViewModel } from "@/app/lib/server/fundings";
import PaperLive from "./PaperLive";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const funding = await getFunding(id);
  if (!funding) return { title: "롤링페이퍼를 찾을 수 없어요" };

  const ownerName = funding.owner.name ?? "친구";
  const title = `${ownerName}님의 축하 롤링페이퍼 💌`;
  return {
    title,
    description: `${funding.title}을 위해 친구들이 남긴 마음을 확인해보세요.`,
  };
}

export default async function PaperPage({ params }: Props) {
  const { id } = await params;
  const [funding, session] = await Promise.all([getFunding(id), auth()]);
  if (!funding) notFound();

  const isOwner = session?.user?.id === funding.owner.id;
  const initial = toLiveViewModel(funding, isOwner, { includeAmounts: false });

  return (
    <PaperLive
      fundingId={funding.id}
      title={funding.title}
      ownerName={funding.owner.name}
      isOwner={isOwner}
      initial={initial}
    />
  );
}
