import Link from "next/link";
import type { IssueMapItem } from "@/lib/api/issueMap";
import { issueHref } from "@/lib/slug";

// ── IssueMapCard ────────────────────────────────
/**
 * 그리드 한 행의 카드 높이를 맞춘다.
 *
 * 이슈명이 길거나 뷰포트가 좁아지면 제목이 두 줄로 내려가 카드가 커진다.
 * grid item 인 `<a>` 는 기본 `align-items: stretch` 로 행 높이만큼 늘어나지만
 * 안쪽 `<article>` 이 그 높이를 물려받지 않아 한 줄짜리 카드가 짧아 보인다.
 * `h-full` 로 높이를 바닥까지 전달하고, 토론 수는 `mt-auto` 로 아래에 붙인다.
 */
export default function IssueMapCard({ data }: { data: IssueMapItem }) {
  return (
    <Link href={issueHref(data.issueId, data.title)} className="block h-full">
      <article className="flex h-full flex-col rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
        {/* 제목 */}
        <h3 className="text-body-16 font-semibold text-text-primary line-clamp-2">
          {data.title}
        </h3>

        {/* 토론 수 */}
        <div className="flex items-center mt-auto pt-3">
          <span className="text-caption-12 text-text-secondary">
            토론 {data.countChatRoom}개
          </span>
        </div>
      </article>
    </Link>
  );
}
