import UrlForm from "./components/UrlForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 px-6 py-20">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">OG 미리보기</h1>
        <p className="text-sm text-neutral-500">
          상품 URL을 입력하면 Open Graph 데이터를 카드로 보여줍니다.
        </p>
      </div>
      <UrlForm />
    </main>
  );
}
