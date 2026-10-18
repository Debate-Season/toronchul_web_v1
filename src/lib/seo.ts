/**
 * SEO 단일 출처 (PRD v0.9.0 §6.1).
 *
 * 도메인은 `NEXT_PUBLIC_SITE_URL` 에서만 온다. 페이지 Metadata 의 canonical·OG url 은
 * 상대 경로로 두고 `metadataBase` 가 절대화한다. JSON-LD 안의 URL 만 여기서 절대화한다.
 */
import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toronchul.app";
export const SITE_NAME = "토론철";
export const SITE_DESCRIPTION =
  "지금 뜨거운 이슈마다 찬반으로 나뉘어 토론하는 곳. 토론 주제별 찬반 현황과 참여 커뮤니티를 확인하고 의견을 남겨 보세요.";

/** JSON-LD·sitemap 용 절대 URL */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** 메타 설명 정리 — 줄바꿈 제거, 공백 압축, 길이 상한(PRD §9.2: 155자 이하) */
export function toDescription(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** 백엔드의 `yyyy-MM-dd'T'HH:mm:ss`(Asia/Seoul, 오프셋 없음)를 ISO 8601 로 */
export function seoulToIso(value: string): string {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}+09:00`;
}

/**
 * 백엔드 시각 문자열 중 늦은 쪽. 같은 `yyyy-MM-dd'T'HH:mm:ss` 형식이라 사전순 비교가
 * 곧 시간순 비교다. 둘 다 없으면 undefined.
 */
export function laterOf(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/** 상세 페이지 공통 Metadata. canonical·OG url 은 같은 상대 경로를 쓴다(§9.3 3자 일치) */
export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: input.type ?? "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: input.title,
      description: input.description,
      url: input.path,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: ["/og-image.png"],
    },
  };
}

// ── JSON-LD ──────────────────────────────────────
// 화면에 그리는 데이터만 넣는다(§9.2 "JSON-LD 는 화면 콘텐츠와 일치").

type JsonLdObject = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * 전역 Organization. `sameAs` 는 실제 URL 이 확인되기 전까지 넣지 않는다(§7-4).
 */
export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: "Toronchul",
    url: SITE_URL,
    logo: absoluteUrl("/icon.png"),
  };
}

/** URL 에 단어가 없으므로 브레드크럼을 직접 준다(PRD §4.3a) */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function issueJsonLd(input: {
  path: string;
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}): JsonLdObject {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    ...(input.datePublished && { datePublished: seoulToIso(input.datePublished) }),
    ...(input.dateModified && { dateModified: seoulToIso(input.dateModified) }),
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "ko",
  };
}

/**
 * 토론 주제. 채팅 내역은 아직 공개 조회 경로가 없어(§7-1) `comment` 를 넣지 않는다.
 * 찬반은 schema.org 표준 행동이 없어 총 투표 수만 `VoteAction` 으로 싣고, 찬반 수치는
 * 화면과 같은 문장으로 `text` 에 담는다.
 */
export function debateJsonLd(input: {
  path: string;
  title: string;
  text: string;
  datePublished: string;
  votes: number;
  issuePath: string;
}): JsonLdObject {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": `${url}#thread`,
    headline: input.title,
    text: input.text,
    url,
    mainEntityOfPage: url,
    datePublished: seoulToIso(input.datePublished),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/VoteAction",
      userInteractionCount: input.votes,
    },
    isPartOf: { "@id": `${absoluteUrl(input.issuePath)}#article` },
    inLanguage: "ko",
  };
}
