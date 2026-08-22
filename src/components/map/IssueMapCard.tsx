import Link from "next/link";
import type { IssueMapItem } from "@/lib/api/issueMap";
import { issueHref } from "@/lib/slug";

// ── IssueMapCard ────────────────────────────────
export default function IssueMapCard({ data }: { data: IssueMapItem }) {
  return (
    <Link href={issueHref(data.issueId, data.title)}>
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
        {/* 제목 */}
        <h3 className="text-body-16 font-semibold text-text-primary mb-3 line-clamp-2">
          {data.title}
        </h3>

        {/* 토론 수 */}
        <div className="flex items-center mt-2">
          <span className="text-caption-12 text-text-secondary">
            토론 {data.countChatRoom}개
          </span>
        </div>
      </article>
    </Link>
  );
}
