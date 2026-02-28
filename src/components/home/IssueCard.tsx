import Link from "next/link";
import type { ChatRoomResponse } from "@/lib/api/home";

export type { ChatRoomResponse };

// ── 찬반 비율 계산 ──────────────────────────────────
function getPercentages(agree: number, disagree: number) {
  const total = agree + disagree;
  if (total === 0) return { agreePercent: 50, disagreePercent: 50 };
  const agreePercent = Math.round((agree / total) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent };
}

// ── IssueCard ─────────────────────────────────────
export default function IssueCard({ data }: { data: ChatRoomResponse }) {
  const { agreePercent, disagreePercent } = getPercentages(
    data.agree,
    data.disagree,
  );

  return (
    <Link href={`/room/${data.chatRoomId}`}>
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-grey-70">
        {/* 제목 */}
        <h3 className="text-body-16 font-semibold text-text-primary mb-1 line-clamp-2">
          {data.title}
        </h3>

        {/* 해시태그 / 부가 설명 */}
        {data.content && (
          <p className="text-caption-12 text-text-secondary mb-3">
            {data.content}
          </p>
        )}

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

        {/* 찬반 수치 */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-caption-12 font-medium text-red">
            찬성 {agreePercent}%
          </span>
          <span className="text-caption-12 font-medium text-blue">
            반대 {disagreePercent}%
          </span>
        </div>

        {/* 시간 */}
        {data.time && (
          <p className="text-caption-12 text-text-secondary mt-3">
            {data.time}
          </p>
        )}
      </article>
    </Link>
  );
}
