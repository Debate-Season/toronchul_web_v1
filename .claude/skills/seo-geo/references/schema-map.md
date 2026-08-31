# JSON-LD 스키마 매핑

> **언제 읽나** — 페이지에 구조화 데이터를 붙이거나 `src/lib/seo.ts` 의 빌더를 확장할 때.
> **왜 넣는가**: 클래식 검색의 리치 결과·엔티티 인식·음성 어시스턴트. **GEO 효과로 정당화하지 않는다** → `geo-evidence.md` §2

---

## 1. 엔티티별 매핑

| 엔티티 | 경로 | JSON-LD | 상태 |
|---|---|---|---|
| **이슈** | `/issue/{id}-{slug}` | `Article` (+ `about.sameAs`) · `BreadcrumbList` · `ItemList`(타임라인) | 구현 대상 |
| **사건** | `.../event/{id}-{slug}` | `NewsArticle` · `BreadcrumbList` · `isPartOf`→이슈 | **API 없음 — 자리만 예약** (PRD §3.4) |
| **토론** | `.../debate/{id}-{slug}` | `DiscussionForumPosting` (+ `interactionStatistic`, `comment[]`) · `BreadcrumbList` | **채팅 API 401** (PRD §7-1) |
| **AI 뉴스** | `/news/{id}-{slug}` | `NewsArticle` (+ AI 생성 명시) | **게이트 통과 필수** → `ai-news.md` |
| 전역 | `layout.tsx` | `Organization` | 구현 대상 |

`DiscussionForumPosting` 은 Google 이 "Discussions and forums" 리치 결과를 위해 지정한 타입이다. 커뮤니티가 검색 상위를 먹는 그 자리이고, 토론철 콘텐츠 형태와 정확히 맞는다.

## 2. URL 형식 — 절대/상대 규칙

| 위치 | 형식 | 이유 |
|---|---|---|
| `Metadata.alternates.canonical`, `openGraph.url`, `openGraph.images[].url` | **상대** | `metadataBase` 가 절대화 |
| JSON-LD 의 `@id` · `url` · `mainEntityOfPage` · `BreadcrumbList.item` | **절대** | 스펙 필수 |
| `sitemap.xml` 의 `<loc>`, `robots.txt` 의 `Sitemap:` | **절대** | 스펙 필수 |

절대가 필요한 곳은 `${SITE_URL}${path}`. `SITE_URL` 은 `@/lib/seo` 에서만 온다.

---

## 3. 폐기된 타입 — 쓰면 안 된다 ✅

리서치에서 **유일하게 3인 검증을 통과한 항목**이다.

| 타입 | 상태 |
|---|---|
| **FAQPage** | **2026-05-07 부로 전 사이트 대상 Google FAQ 리치 결과 중단. 이득 0** |
| HowTo | 2023-09 제거 |
| SpecialAnnouncement | 2025-07 폐기 |
| ClaimReview · VehicleListing · EstimatedSalary · LearningVideo · CourseInfo 캐러셀 | 2025-06 일괄 폐기 |

**여전히 유효**: Organization, Article, NewsArticle, DiscussionForumPosting, Product, LocalBusiness, Event, JobPosting, Course, SoftwareApplication, Service, Q&A, Video, BreadcrumbList, ItemList.

## 4. 타입 선택의 함정

- **사건에 `Event` 를 쓰지 않는다.** schema.org 의 `Event` 는 예정된 행사(공연·컨퍼런스)이고 Google 은 `location`·`startDate` 를 요구한다. 뉴스적 "사건"에 붙이면 GSC 오류가 난다. `NewsArticle` 의 `datePublished`/`dateModified` 가 실시간성의 정확한 표현이다.
- **`WebSite` + `potentialAction: SearchAction` 을 넣지 않는다.** 사이트 내 검색(`/search?q=`)이 실제로 없다. 없는 기능의 마크업은 규격 위반이다.
- **`sameAs` 에 확인 안 된 URL 을 넣지 않는다.** Organization 의 앱스토어·SNS 는 실제 URL 을 확인한 것만 (PRD §7-4).
- **FAQ 형태의 콘텐츠가 생겨도 `FAQPage` 를 붙이지 않는다.** 위 §3.

## 5. 불변 조건

- **JSON-LD 데이터 ≡ 화면 표시 데이터.** 불일치는 페널티다. 화면에 없는 수치를 스키마에만 넣지 않는다.
- **`dateModified` 를 채운다.** AI 는 최신 것을 우선 인용하고, 클래식 검색도 신선도를 본다. 다만 **실제 갱신 시각만** — 빌드 시각 금지(`sitemap.ts` 와 같은 규칙).
- **`about.sameAs` 로 외부 지식 그래프에 접속시킨다.** 이슈 JSON-LD 에 위키백과 등 실제 확인된 URL. 이게 있어야 LLM 이 "이 페이지의 3대 특검 = 내가 아는 그 3대 특검"을 안다. 채우는 방식은 PRD §7-5 미정.
- **빌더 로직을 페이지 파일에 중복 구현하지 않는다.** 전부 `src/lib/seo.ts`.
- **불문율 #1** — Swagger 또는 실 `curl` 없이 DTO 를 만들지 않는다. 사건·AI 뉴스는 백엔드에 아직 없다.

## 6. 검증

- Rich Results Test — https://search.google.com/test/rich-results
- Schema.org Validator — https://validator.schema.org
- 새 타입을 붙이기 전 **Google 규격 문서를 먼저 확인** — https://developers.google.com/search/docs/appearance/structured-data
