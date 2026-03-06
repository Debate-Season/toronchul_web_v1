import Link from "next/link";
import { Radio } from "lucide-react";
import type { BestChatRoom } from "@/lib/api/home";
import { roomHref } from "@/lib/slug";

export default function LiveDebateCard({ data }: { data: BestChatRoom }) {
  return (
    <Link href={roomHref(data.issueId, data.issueTitle, data.debateId, data.debateTitle)}>
      <article className="flex-shrink-0 w-64 rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
        {/* LIVE 배지 */}
        <div className="flex items-center gap-1.5 mb-2">
          <Radio size={14} className="text-red" />
          <span className="text-caption-12 font-semibold text-red">LIVE</span>
        </div>

        {/* 토론 제목 */}
        <h3 className="text-body-14 font-semibold text-text-primary mb-2 line-clamp-2 min-h-[2.625rem]">
          {data.debateTitle}
        </h3>

        {/* 이슈 출처 + 시간 */}
        <div className="flex items-center justify-between">
          <span className="text-caption-12 text-text-secondary truncate mr-2">
            {data.issueTitle}
          </span>
          <span className="text-caption-12 text-text-secondary flex-shrink-0">
            {data.time}
          </span>
        </div>
      </article>
    </Link>
  );
}
