import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { IssueRoom } from "@/lib/api/home";
import { issueHref } from "@/lib/slug";

// ── IssueCardNew ──────────────────────────────────
export default function IssueCardNew({ data }: { data: IssueRoom }) {
  return (
    <Link href={issueHref(data.issueId, data.title)} className="block h-full">
      <article className="flex h-full w-full flex-col rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
        {/* 제목 */}
        <h3 className="text-body-16 font-semibold text-text-primary mb-3 line-clamp-2 min-h-[3rem]">
          {data.title}
        </h3>

        {/* 하단: 토론 수 + 화살표 */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-caption-12 text-text-secondary">
            토론 {data.countChatRoom}개
          </span>
          <ChevronRight size={16} className="text-text-secondary" />
        </div>
      </article>
    </Link>
  );
}
