---
name: seo-geo
description: 토론철 웹의 SEO/GEO 담당. 이슈·사건·토론·AI뉴스 상세 페이지가 Google/Naver 검색과 생성형 AI 검색(ChatGPT Search, Perplexity, Claude, AI Overviews)에 잡히게 만든다. URL 스킴, canonical, JSON-LD 구조화 데이터, sitemap, robots.txt, RSC 전환, hreflang/다국어 확장, 메타데이터 품질을 수행. SEO·GEO·검색 노출·색인·구조화 데이터·사이트맵·robots·canonical·메타태그·llms.txt·AI 크롤러 관련 작업에 호출.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(${CLAUDE_SKILL_DIR}/scripts/audit.sh:*), Bash(curl:*), Bash(npm run lint:*), Bash(npx tsc:*)
---

# SEO/GEO — 토론철 웹

`https://toronchul.app` 의 검색 가시성을 담당한다. Next.js 16 App Router · React 19 · TypeScript 5.

> **권위 문서** — 결정 근거는 PRD 에서 인용한다. 새 결정이 생기면 **PRD 를 먼저 고치고** 이 파일에 반영한다.
> - `docs/prd/v0.9.0_seo-geo.md` — 무엇을·왜 (결정과 근거)
> - `docs/seo-implementation.md` — 구현 현황·트러블슈팅 (v0.9.0 착수 시 생성)
>
> `docs/ideation/*` 는 **다른 프로젝트(BigValue, 700만 페이지 pSEO)** 문서다. 원칙만 참고하고 규모 대응(크롤 버짓·WAF·Thin Content 임계값)은 적용하지 않는다 — PRD §3.3. 단 `seo-geo-skill-research.md` 는 이 스킬의 개정 근거이므로 예외다.

---

## 시작 절차

**Step 1** — `docs/prd/v0.9.0_seo-geo.md` (URL 전략 §4, 페이지별 설계 §5, 인프라 §6, 미해결 §7, 검증 §9) → `docs/seo-implementation.md` → `CLAUDE.md` 불문율 8개.

**Step 2** — `references/` 는 **시작 시 전부 로드하지 않는다.** 아래 조건에 해당할 때만 읽는다.

| 파일 | 읽는 조건 |
|---|---|
| `references/geo-evidence.md` | GEO 기법 선택 · "스키마가 AI 인용을 올리나" · llms.txt 요청 |
| `references/crawler-policy.md` | `robots.ts` 작성/수정 · AI 봇 허용 판단 · **Naver 색인 문제** |
| `references/schema-map.md` | JSON-LD 추가/수정 · `src/lib/seo.ts` 빌더 확장 |
| `references/content-patterns.md` | 페이지 본문 문구 작성/검토 · 메타 문구 길이 |
| `references/ai-news.md` | **`/news/*` 관련 모든 작업** · `generateSitemaps` · 대량 발행 계획 |

**Step 3** — 인자가 있으면 그 작업($ARGUMENTS), 없으면 전체 감사.

### 핵심 파일

| 파일 | 역할 |
|---|---|
| `src/lib/seo.ts` | `SITE_URL` · `buildMetadata` · `buildAlternates` · JSON-LD 빌더 — **단일 출처** |
| `src/lib/slug.ts` | `toSlug` · `issueHref` · `threadHref` — URL 조립의 유일한 경로 |
| `src/app/layout.tsx` | `metadataBase` · `title.template` · 전역 robots/OG · Organization JSON-LD |
| `src/app/robots.ts` · `src/app/sitemap.ts` | 봇 규칙 · URL 목록 |
| `src/app/issue/[issueSlug]/page.tsx` · `.../debate/[threadSlug]/page.tsx` | 상세 (서버 컴포넌트) |
| `src/lib/api/{issue,room,chat}.ts` | SSR 데이터 소스 (`apiFetch` 경유) |

---

## 핵심 원칙

### URL — 토론철에서 가장 중요한 축

1. **정체성은 id, slug 는 장식** — `{id}-{slug}` 융합, id 는 선두 10진수. 제목이 바뀌어도 정체성 불변
2. **정식형은 하나뿐** — slug 가 다르거나 없으면 **301**. 200 방치 금지
3. **URL 은 `src/lib/slug.ts` 헬퍼로만 만든다** — 컴포넌트에서 문자열 조립 금지
4. **slug 는 NFC 정규화 + 80자 상한** — NFD 한글이 섞이면 같은 문서가 다른 바이트열 URL 이 되어 301 루프
5. **로케일은 `as-needed`** — 한국어 무접두, 영어 `/en/…`. 영어 출시 시 한국어 URL 이 하나도 바뀌면 안 된다
6. **로케일 접두어는 색인 트리에만** — `/oauth/*` `/api/*` `/login` `/settings/*` `/profile/*` `/onboarding/*` 은 **절대 건드리지 않는다.** 카카오·애플 콘솔에 등록된 Redirect URI 이고 운영 중인 모바일 앱과 호환돼야 한다
7. **한 번 색인된 URL 은 바꾸지 않는다** — 지금이 마지막 기회 (PRD §3.1)

### 렌더링

8. **핵심 콘텐츠는 서버에서 렌더한다** — "서버 셸 + 클라이언트 아일랜드". 위키 본문·스레드 목록·채팅 내역은 서버, 소켓·투표·입력은 아일랜드
9. **색인 대상 `page.tsx` 에 `"use client"` 를 넣지 않는다** — 넣는 순간 크롤러가 보는 본문이 0 이 된다
10. **SSR 호출은 토큰 없이** — `apiFetch` 의 401 분기가 브라우저 전용 `logout` 을 동적 import 한다. 토큰이 없으면 그 분기를 타지 않는다

### canonical · 메타데이터

11. **도메인은 `NEXT_PUBLIC_SITE_URL` 단일 출처** — 하드코딩·`const SITE_URL` 로컬 선언 금지, `@/lib/seo` import 만
12. **페이지 Metadata 의 canonical·OG url·OG image 는 상대 경로** — `metadataBase` 가 절대화한다. JSON-LD 내부 URL 만 절대 (`schema-map.md` §2)
13. **canonical ↔ OG url ↔ sitemap `<loc>` 3자 일치.** canonical 에 쿼리 파라미터 금지
14. **메타 문구는 페이지마다 고유, `\n` 금지** — 길이 기준은 한국어/영어가 다르다 (`content-patterns.md`)

### sitemap · robots

15. **`lastModified` 는 실제 데이터 갱신일만** — `new Date()`·빌드 시각 절대 금지. UI 배포로 갱신하지 않는다
16. **noindex ↔ sitemap 동기화는 불변** — 한쪽만 적용하면 "크롤해라 + 색인하지 마라" 모순 신호
17. **`/relay/` 차단 필수** — PostHog 리버스 프록시(v0.8.0). 크롤러가 두드리면 분석 데이터가 오염된다
18. **`kakaotalk-scrap` 허용 유지** — 국내 유입의 상당수가 카카오톡 공유다
19. **`Yeti` 를 이름으로 명시** — 누락하면 Naver 가 통째로 차단될 수 있다 [P0] (`crawler-policy.md` §3)

### 구조화 데이터 — 클래식 검색용이다

20. **스키마는 리치 결과·엔티티 인식을 위해 넣는다. GEO 효과로 정당화하지 않는다.** JSON-LD 추가의 AI 인용 효과는 인과연구에서 0과 구분되지 않았다 (`geo-evidence.md` §2)
21. **화면 콘텐츠 ≡ JSON-LD 데이터.** 불일치는 페널티
22. **폐기된 타입을 쓰지 않는다** — FAQPage 는 2026-05-07 부로 Google 리치 결과 종료 (`schema-map.md` §3)

### GEO — 실증된 것만

23. **페이지 종류마다 최적 기법이 다르다** — 토론 페이지는 Authoritative + Statistics, 이슈위키는 Cite Sources. Debate 도메인에서만 권위적 어조가 먹힌다 (`content-patterns.md`)
24. **사실 밀도가 가장 강한 카드다** — 찬반 수치·참여자 수·커뮤니티 분포는 **토론철만 가진 1차 데이터**다. 구체 수치와 날짜를 페이지 상단에
25. **인용 가능한 독립 문장** — 문맥 없이 떼어내도 의미가 통해야 한다. Keyword Stuffing 은 효과가 없고 Perplexity 에서는 오히려 나빴다
26. **`dateModified` 를 채운다** — AI 는 최신 것을 우선 인용한다. 단 실제 갱신 시각만
27. **AI 봇 차단은 GEO 레버가 아니다** — 학습 봇 차단은 **콘텐츠 라이선스·법무 결정**이다. SEO 로서 어느 쪽도 권고하지 않고, 결정된 정책을 robots.txt 에 정확히 옮기는 것만 한다 (`crawler-policy.md` §1)

### 데이터

28. **불문율 #1 우선** — Swagger(`https://toronchul.app/prod/v3/api-docs`) 또는 실 `curl` 없이 DTO 를 만들지 않는다. **사건·AI 뉴스는 백엔드에 아직 없다** (PRD §3.4)

---

## 작업 모드

| 모드 | 하는 일 |
|---|---|
| **audit** | `bash ${CLAUDE_SKILL_DIR}/scripts/audit.sh [경로]` 실행 → 출력을 아래 형식으로 해석. 스크립트는 사실만 내고 판정하지 않는다 |
| **implement** | 현재 코드 확인 → PRD 해당 절 확인 → **계획 보고, 승인 전 구현 금지** → 구현 → `npm run lint`·`npx tsc --noEmit`·`npm run build` → 문서 갱신 |
| **add-schema** | `references/schema-map.md` 를 먼저 읽는다. 폐기 타입 확인 → Google 규격 확인 → `src/lib/seo.ts` 빌더 확장 |
| **validate** | PRD §9 체크리스트 실행 + Rich Results Test · Schema.org Validator |
| **optimize-geo** | `references/geo-evidence.md`·`content-patterns.md` 를 읽는다. 페이지 종류별 기법 매핑 점검 |
| **url-check** | 정식형 200 / 틀린 slug 301 / id 만 301 / 잘못된 id 404 / OAuth 경로 무개입 / canonical 일치 |
| **i18n-prep** | `/en` 도입 시 한국어 URL 이 하나도 안 바뀌는지, `alternates.languages` 가 로케일 추가에 열려 있는지 |
| **news-gate** | `references/ai-news.md` 의 발행 게이트 체크리스트를 실행. **하나라도 미충족이면 `/news/` Disallow 권고** |
| **update-doc** | 결정·전략 변경 → PRD. 코드 패턴·트러블슈팅·현황 → `docs/seo-implementation.md`. 이 파일은 요약·절차만 |

**audit 출력 형식**

```
## SEO/GEO 감사 ({날짜})
### 정상
- [x] 항목 — 근거 (파일:라인 또는 실측값)
### 미해결 (우선순위)
- [ ] [P0] 항목 — 문제 / 수정 방안 / 파일:라인
### GEO
- 항목 — 상태 + 권고
```

---

## 절대 하지 않는 것

원칙 1~28 은 위에 있다. 여기엔 **되돌릴 수 없거나 도메인 전체를 죽이는 것**만 적는다.

- **이미 색인된 URL 스킴을 바꾼다** (원칙 7) — 영구 리다이렉트 체인을 진다
- **로케일 미들웨어를 인증·앱 경로에 적용한다** (원칙 6) — 운영 중인 로그인과 모바일 앱이 즉시 깨진다
- **사이트맵·소유확인 파일의 URL 을 바꾼다** — 재등록이 필요해진다. `public/naver*.html` 은 Disallow 에 걸려도 안 되고 sitemap 에 넣어도 안 된다
- **`llms.txt` 를 만든다** — 3개 독립 실측이 모두 무의미 결론(발행 도메인의 97%가 한 달간 fetch 0회). 요청받으면 `geo-evidence.md` §3 을 근거로 거절하고 실증된 기법에 자원을 돌린다
- **AI 생성 기사를 사람 검수·AI 명시 없이 대량 발행한다** — scaled content abuse 판정은 **도메인 전체**를 죽인다. 이슈·토론 페이지까지 같이 (`ai-news.md`)
- **채팅 내역을 약관·개인정보처리방침 근거 없이 검색엔진에 공개한다** (PRD §7-2)
- **검색엔진 크롤러를 차단한다**
- **`docs/ideation/*`(BigValue) 의 규모 대응을 토론철에 그대로 적용한다** — 우리는 URL 50개다
- **⚠ 표기된 미검증 주장을 하드 규칙으로 승격한다** — 근거의 신뢰도를 지우지 않는다 (`geo-evidence.md` §5)

---

## 참고

PRD `docs/prd/v0.9.0_seo-geo.md` · 구현 현황 `docs/seo-implementation.md` · 개정 근거 `docs/ideation/seo-geo-skill-research.md`
Swagger `https://toronchul.app/prod/v3/api-docs` · Google 구조화 데이터 규격 https://developers.google.com/search/docs/appearance/structured-data · Rich Results Test https://search.google.com/test/rich-results · Schema.org Validator https://validator.schema.org
