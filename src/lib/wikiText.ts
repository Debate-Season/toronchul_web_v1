/**
 * 토론위키 본문(Markdown)에서 화면·메타용 평문을 뽑는다 (PRD v1.0.0 §3.1).
 *
 * 백엔드 요약 필드(`summary`, B-1)가 생기기 전과, ADMIN 수동 리비전처럼 요약이 빈
 * 경우에 쓰는 폴백이다. 본문 첫 문단(정의 문단)을 문장 단위로 잘라 쓴다 — 문장
 * 중간에서 끊으면 사이드바 카드와 검색 결과 스니펫이 어색해진다.
 */

/** 위키 생성·검수 고지. 화면과 JSON-LD `creditText` 가 같은 문구를 쓴다(§4.3) */
export const WIKI_CREDIT_TEXT = "토론철 AI 가 작성하고 운영진이 검수했습니다";

/** 좁은 자리(토론방 사이드바 카드)용 같은 고지 */
export const WIKI_CREDIT_SHORT = "토론철 AI 작성 · 운영진 검수";

/** Markdown 인라인 문법을 걷어 평문으로 */
function stripInline(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크 → 글자만
    .replace(/[*_~`]+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 제목·목록·인용·표·코드가 아닌 첫 문단 */
function firstParagraph(markdown: string): string | null {
  let inCode = false;
  for (const block of markdown.split(/\n\s*\n/)) {
    const lines = block.split("\n");
    if (lines.some((l) => l.trim().startsWith("```"))) {
      // 코드 블록 경계가 문단 안에 있으면 그 문단은 건너뛰고 상태만 뒤집는다
      const fences = lines.filter((l) => l.trim().startsWith("```")).length;
      if (fences % 2 === 1) inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const head = lines[0].trim();
    if (!head || /^(#{1,6}\s|[-*+]\s|\d+\.\s|>|\||---|\*\*\*)/.test(head)) continue;
    const text = stripInline(lines.join(" "));
    if (text) return text;
  }
  return null;
}

/** 첫 문단을 `max` 자 이내로, 문장 경계에서 자른다. 쓸 문단이 없으면 null */
export function wikiSummaryFromMarkdown(markdown: string, max = 160): string | null {
  const paragraph = firstParagraph(markdown);
  if (!paragraph) return null;
  if (paragraph.length <= max) return paragraph;

  // 문장 끝(. ? ! 다. 요.)에서 끊는다. 첫 문장부터 넘치면 단어 경계에서 자르고 말줄임
  const sentences = paragraph.match(/[^.?!。]+[.?!。]+["'”’)]*\s*/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim()) return out.trim();
  const cut = paragraph.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2)).trimEnd()}…`;
}

/** 백엔드 시각(`yyyy-MM-ddTHH:mm:ss`, Asia/Seoul) → 화면용 `yyyy.MM.dd` */
export function formatWikiDate(value: string): string {
  return value.slice(0, 10).replace(/-/g, ".");
}
