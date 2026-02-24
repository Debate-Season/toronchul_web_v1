import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { IssueMapItem } from "@/lib/api/issueMap";

// ── IssueMapCard ────────────────────────────────
export default function IssueMapCard({ data }: { data: IssueMapItem }) {
  return (
    <Link href={`/issue/${data.issueId}`}>
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-grey-70">
        {/* 제목 */}
        <h3 className="text-body-16 font-semibold text-text-primary mb-3 line-clamp-2">
          {data.title}
        </h3>

        {/* 토론 수 + 북마크 */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-caption-12 text-text-secondary">
            토론 {data.countChatRoom}개
          </span>
          <span className="flex items-center gap-1 text-caption-12 text-text-secondary">
            <Bookmark size={12} />
            {data.bookMarks}
          </span>
        </div>
      </article>
    </Link>
  );
}
