import type { OgResult } from "@/app/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1 text-xs font-medium text-neutral-400">{label}</div>
      {children}
    </section>
  );
}

export default function OgCard({ data }: { data: OgResult }) {
  if (data.empty) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        이 사이트는 Open Graph 데이터를 제공하지 않거나 접근이 차단되었습니다.
        <div className="mt-1 text-sm opacity-70">{data.host}</div>
      </div>
    );
  }

  const priceText = [data.price, data.currency].filter(Boolean).join(" ");

  // 핵심 외에 추가로 표시할 메타 항목들
  const meta: [string, string | null][] = [
    ["종류 (og:type)", data.type],
    ["언어 (og:locale)", data.locale],
    ["날짜", data.date],
    ["재고", data.availability],
    ["작성자", data.author],
    ["트위터 카드", data.twitter.card],
    ["트위터 계정", data.twitter.site ?? data.twitter.creator],
  ];
  const metaShown = meta.filter(([, v]) => v);

  // raw에서 노이즈 키 제외하고 값 있는 것만
  const SKIP = new Set(["success", "requestUrl", "charset"]);
  const rawEntries = Object.entries(data.raw).filter(
    ([k, v]) => !SKIP.has(k) && v !== null && v !== undefined && v !== "",
  );

  return (
    <div className="space-y-5 rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-neutral-900">
      {/* 이미지 (여러 장) */}
      <Field label={`이미지 (${data.images.length}장)`}>
        {data.images.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt={img.alt || `image ${i + 1}`}
                className="h-40 w-auto shrink-0 rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800"
              />
            ))}
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
            이미지 없음
          </div>
        )}
      </Field>

      <Field label="제목">
        <h2 className="text-lg font-semibold leading-snug">
          {data.title || "(제목 없음)"}
        </h2>
      </Field>

      {priceText && (
        <Field label="가격">
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {priceText}
          </div>
        </Field>
      )}

      {data.description && (
        <Field label="설명">
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {data.description}
          </p>
        </Field>
      )}

      {data.video && (
        <Field label="영상">
          <a
            href={data.video}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {data.video}
          </a>
        </Field>
      )}

      {/* 기타 메타데이터 */}
      {metaShown.length > 0 && (
        <Field label="메타데이터">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {metaShown.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-400">{k}</dt>
                <dd className="break-all text-neutral-700 dark:text-neutral-300">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </Field>
      )}

      {/* 출처 / 링크 */}
      <section className="flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10">
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          {data.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.favicon} alt="" className="h-4 w-4 rounded-sm" />
          )}
          {data.siteName}
        </span>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          원본 페이지 열기 →
        </a>
      </section>

      {/* 파싱된 모든 필드 (UI) */}
      <Field label={`파싱된 모든 필드 (${rawEntries.length}개)`}>
        <dl className="divide-y divide-black/5 rounded-lg border border-black/5 dark:divide-white/5 dark:border-white/10">
          {rawEntries.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3 px-3 py-2"
            >
              <dt className="break-all text-xs font-medium text-neutral-400">
                {key}
              </dt>
              <dd className="min-w-0 text-sm text-neutral-700 dark:text-neutral-300">
                <RawValue value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </Field>
    </div>
  );
}

function looksLikeImage(s: string): boolean {
  return (
    /^https?:\/\//.test(s) && /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(s)
  );
}

/** raw 값(문자열/숫자/배열/객체)을 종류에 맞게 UI로 렌더링한다. */
function RawValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-neutral-400">—</span>;
  }

  if (typeof value === "boolean") {
    return <span>{value ? "true" : "false"}</span>;
  }

  if (typeof value === "number") {
    return <span>{value}</span>;
  }

  if (typeof value === "string") {
    if (looksLikeImage(value)) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={value}
          alt=""
          className="h-16 w-auto rounded bg-neutral-100 object-cover dark:bg-neutral-800"
        />
      );
    }
    if (/^https?:\/\//.test(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-blue-600 hover:underline dark:text-blue-400"
        >
          {value}
        </a>
      );
    }
    return <span className="break-words">{value}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {value.map((v, i) => (
          <RawValue key={i} value={v} />
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <dl className="space-y-0.5">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="shrink-0 text-xs text-neutral-400">{k}:</dt>
            <dd className="min-w-0">
              <RawValue value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span>{String(value)}</span>;
}
