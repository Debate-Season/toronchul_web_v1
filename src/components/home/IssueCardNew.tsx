import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BestIssueRoom } from "@/lib/api/home";

export type { BestIssueRoom };

// ── IssueCardNew ──────────────────────────────────
export default function IssueCardNew({ data }: { data: BestIssueRoom }) {
  return (
    <Link href={`/issue/${data.issueId}`}>
      <article className="flex-shrink-0 w-56 rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-grey-70">
        {/* 제목 */}
        <h3 className="text-body-14 font-semibold text-text-primary mb-3 line-clamp-2 min-h-[2.625rem]">
          {data.title}
        </h3>

        {/* 하단: 토론 수 + 화살표 */}
        <div className="flex items-center justify-between">
          <span className="text-caption-12 text-text-secondary">
            토론 {data.countChatRoom}개
          </span>
          <ChevronRight size={16} className="text-text-secondary" />
        </div>
      </article>
    </Link>
  );
}
