import Link from "next/link";
import type { ChatRoomResponse } from "@/lib/api/home";
import DeVoteGauge from "@/components/TDS/DeVoteGauge";

export type { ChatRoomResponse };

// ── IssueCard ─────────────────────────────────────
export default function IssueCard({ data }: { data: ChatRoomResponse }) {
  return (
    <Link href={`/room/${data.chatRoomId}`}>
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
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

        {/* 찬반 게이지 */}
        <DeVoteGauge agree={data.agree} disagree={data.disagree} size="md" />

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
