import Link from "next/link";
import type { IssueMapItem } from "@/lib/api/issueMap";

// ── 찬반 비율 계산 ──────────────────────────────
function getPercentages(agree: number, disagree: number) {
  const total = agree + disagree;
  if (total === 0) return { agreePercent: 50, disagreePercent: 50 };
  const agreePercent = Math.round((agree / total) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent };
}

// ── IssueMapCard ────────────────────────────────
export default function IssueMapCard({ data }: { data: IssueMapItem }) {
  const { agreePercent, disagreePercent } = getPercentages(
    data.agree,
    data.disagree,
  );

  return (
    <Link href={`/issue/${data.id}`}>
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-grey-70">
        {/* 카테고리 태그 */}
        <span className="inline-block text-caption-12 font-medium text-brand bg-tag rounded-full px-2.5 py-0.5 mb-2">
          {data.category}
        </span>

        {/* 제목 */}
        <h3 className="text-body-16 font-semibold text-text-primary mb-3 line-clamp-2">
          {data.title}
        </h3>

        {/* 찬반 비율 바 */}
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-red transition-all"
            style={{ width: `${agreePercent}%` }}
          />
          <div
            className="bg-blue transition-all"
            style={{ width: `${disagreePercent}%` }}
          />
        </div>

        {/* 찬반 수치 + 토론 수 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="text-caption-12 font-medium text-red">
              찬성 {agreePercent}%
            </span>
            <span className="text-caption-12 font-medium text-blue">
              반대 {disagreePercent}%
            </span>
          </div>
          <span className="text-caption-12 text-text-secondary">
            토론 {data.countChatRoom}개
          </span>
        </div>
      </article>
    </Link>
  );
}
