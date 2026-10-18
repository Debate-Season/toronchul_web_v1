import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { WIKI_CREDIT_TEXT, formatWikiDate } from "@/lib/wikiText";

interface IssueWikiProps {
  /** 게시된 위키 본문 (Markdown) */
  content: string;
  /** 위키 갱신 시각 — 백엔드 형식 그대로 */
  updatedAt: string;
}

/**
 * 이슈 상세의 토론위키 본문 (PRD v1.0.0 §4.1). **서버 컴포넌트** — 크롤러가 받는
 * HTML 에 본문이 그대로 들어가야 한다. 클라이언트 뷰에는 렌더된 결과만 슬롯으로 넘긴다.
 *
 * - 원시 HTML 은 렌더하지 않는다(`skipHtml`). 위키는 AI 가 쓰는 글이라 어떤 태그가
 *   섞여 올지 보장할 수 없다
 * - 페이지 H1 은 이슈 제목 하나뿐이므로 위키의 `#` 은 H2 로 한 단계씩 내린다.
 *   목차(H2/H3)를 살려야 부분 인용이 쉬워진다
 * - 외부 링크는 새 탭 + `noopener nofollow`. 위키가 가리키는 외부 글을 토론철이
 *   보증하지 않는다
 */
export default function IssueWiki({ content, updatedAt }: IssueWikiProps) {
  return (
    <section
      id="wiki"
      // 섹션 제목("토론위키")은 화면에 두지 않는다 — 위키의 절(개요·배경…)이 곧 이 페이지의 h2 다
      aria-label="토론위키"
      // 카드로 감싸지 않는다 — 위키는 이 페이지의 본문이라 배경 위에 글로 놓는다
      className="scroll-mt-20"
    >

      <div className="flex flex-col gap-4 text-body-16 leading-relaxed text-text-primary">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={MARKDOWN_COMPONENTS}
        >
          {content}
        </ReactMarkdown>
      </div>

      <p className="mt-6 text-caption-12 text-text-secondary">
        {WIKI_CREDIT_TEXT} · 최종 수정 {formatWikiDate(updatedAt)}
      </p>
    </section>
  );
}

const MARKDOWN_COMPONENTS: Components = {
  // 페이지 H1 은 이슈 제목이고 위키의 절이 곧 페이지의 h2 다. 위키는 `## 개요` 처럼 `##` 로 절을
  // 나누므로 `#`·`##` → h2, `###` → h3, `####` → h4 로 둔다. 크기는 이슈 페이지 위계 표와 같다
  // (h1 28 · h2 24 · h3 20 · h4 18)
  h1: ({ children }) => (
    <h2 className="mt-8 text-header-24 font-bold text-text-primary first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 text-header-24 font-bold text-text-primary first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-header-20 font-bold text-text-primary">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 text-header-18 font-semibold text-text-primary">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="mt-3 text-body-16 font-bold text-text-primary">{children}</h5>
  ),
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 text-text-secondary">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className="text-brand underline underline-offset-2"
        {...(external && { target: "_blank", rel: "noopener nofollow" })}
      >
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body-14">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
  hr: () => <hr className="border-border" />,
  // 이미지는 그리지 않는다 — 위키 이미지 정책·호스트가 정해지지 않았다
  img: () => null,
};
