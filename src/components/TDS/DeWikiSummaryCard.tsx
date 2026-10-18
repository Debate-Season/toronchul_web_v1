import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

interface DeWikiSummaryCardProps {
  /** 카드의 주제줄로 노출할 이슈 제목 */
  issueTitle: string;
  /** 토론위키 요약. 평문, 호출자가 이미 다듬은 2~3문장 */
  summary: string;
  /** 위키 전체 보기 링크 (예: "/issue/8#wiki") */
  href: string;
  /** 호출자가 포맷을 마친 표시용 날짜. "최종 수정 {updatedAt}" 으로 노출 */
  updatedAt: string;
  /** AI 작성 고지 문구 (예: "토론철 AI 작성 · 운영진 검수"). 필수 노출 */
  creditText: string;
  /** 링크 문구. 기본 "위키 전체 보기" */
  linkLabel?: string;
}

/**
 * 이슈 토론위키 요약 카드. 토론방 우측 사이드바(주제 패널 아래)와
 * 모바일 본문 흐름에 놓인다.
 *
 * 훅/클라이언트 상태가 없는 서버 렌더 컴포넌트다. 모바일 사본은 크롤러가
 * SSR HTML 로 읽으므로 "use client" 를 붙이지 않는다.
 * 페이지 h1 은 스레드 제목이므로 제목은 h2 를 쓴다.
 * AI 작성 고지(creditText)는 숨기지 않고 항상 보이게 둔다.
 */
export default function DeWikiSummaryCard({
  issueTitle,
  summary,
  href,
  updatedAt,
  creditText,
  linkLabel = "위키 전체 보기",
}: DeWikiSummaryCardProps) {
  return (
    <section
      aria-label="토론위키 요약"
      className={[
        "flex flex-col gap-3",
        "rounded-xl border border-border p-4",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <BookOpen
          size={18}
          className="flex-shrink-0 text-brand"
          aria-hidden="true"
        />
        <h2 className="text-body-16 font-bold text-text-primary">토론위키</h2>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-body-14 font-semibold text-text-primary">
          {issueTitle}
        </p>
        <p className="line-clamp-4 text-body-14 text-text-secondary">
          {summary}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-caption-12 text-text-secondary">{creditText}</p>
        <p className="text-caption-12 text-text-secondary">
          최종 수정 {updatedAt}
        </p>
      </div>

      <Link
        href={href}
        className={[
          "inline-flex items-center gap-0.5 self-start",
          "text-body-14 font-medium text-brand",
        ].join(" ")}
      >
        {linkLabel}
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
