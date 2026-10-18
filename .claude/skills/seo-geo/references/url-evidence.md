# URL 근거 — 슬러그 · ID · 다국어 · 번역

> **언제 읽나** — URL 스킴을 바꾸자는 제안이 나올 때, "슬러그를 넣으면 SEO 가 좋아지지 않나" · "`/en` 을 만들자" · "브라우저 언어로 자동 전환하자" 요청을 받았을 때, 번역 기능을 설계할 때.
> 원본: 2026-10-19 공식 문서 재확인 · PRD §4.3 · §5.6
>
> 신뢰도: ✅ 공식 문서 원문 확인 · ◐ 공식이지만 스니펫/부분 확인 · ⚠ 2차 자료(방향성만)

---

## 1. 슬러그 — 서비스별 공식 입장

| 서비스 | 공식 문서 내용 | 신뢰도 |
|---|---|---|
| **Google** | URL 경로의 키워드는 **"hardly any effect"** (브레드크럼 표시 외). **"A URL that only contains random identifiers is less helpful for users"**. 브레드크럼은 **"Google learns breadcrumbs automatically based on the words in the URL"**. 비ASCII 는 퍼센트 인코딩. **URL 은 대소문자를 구분**한다. 디렉터리 구조는 **"a few thousand URLs"** 를 넘으면 크롤링·색인에 영향, 디렉터리별 갱신 빈도를 학습 | ✅ (SEO Starter Guide · URL structure, 2025-12-10) |
| **Bing** | 중복 URL 은 **그라운딩·인용 URL 선택 신뢰도를 깎는다.** 하나의 주제에 집중한 URL 이 그라운딩에 더 잘 선택된다. 사이트맵에는 정식 URL 만. 슬러그 키워드 규칙은 없음 | ◐ (Webmaster Guidelines — JS 렌더 페이지라 검색 스니펫으로만 확인) |
| **Naver** | 「검색 친화적인 URL 구축하기」: 사용자·로봇이 쉽게 해석하는 URL, **파라미터 최소화**, 경로는 **통상 소문자**, fragment·해시뱅은 해석하지 않음. **한글 URL·ID 형식 언급 없음** | ✅ (searchadvisor.naver.com/guide/seo-advanced-url) |
| **Gemini** | Gemini 앱 그라운딩 = **Google 검색 색인**. `Google-Extended` 는 학습·그라운딩 opt-out 토큰이며 **"does not impact a site's inclusion in Google Search nor is it used as a ranking signal"** | ✅ (Google common crawlers, 2026-10-15) |
| **AI Overviews · AI Mode** | **"no additional requirements … nor other special optimizations necessary"**. 색인되어 스니펫 노출이 가능하면 대상 | ✅ (AI features, 2025-12-10) |
| **OpenAI / ChatGPT** | `OAI-SearchBot` 차단 시 ChatGPT 검색에 미노출. `GPTBot` = 학습. `ChatGPT-User` 는 robots.txt 미적용 가능. **URL 언급 없음** | ✅ (developers.openai.com/api/docs/bots · Publishers FAQ) |
| **Claude** | `Claude-SearchBot` = 검색 색인, `Claude-User` = 사용자 요청 fetch, `ClaudeBot` = 학습. **출처 선정 기준·URL 언급 없음** | ✅ (support.claude.com 8896518) |
| **Perplexity** | `PerplexityBot` = 검색 노출(학습 미사용), `Perplexity-User` 는 robots.txt 를 대체로 무시. **URL 언급 없음** | ✅ (docs.perplexity.ai/guides/bots) |

**결론** — 슬러그가 순위·인용에 영향을 준다고 명시한 곳은 **없다.** Google·Naver 는 "읽을 수 있는 URL" 을 **사용자 이해** 근거로 권장한다. 토론철은 그 권장에서 벗어나는 대신 정식형 단일성을 택했고(PRD §4.3a), 브레드크럼은 `BreadcrumbList` JSON-LD 로 직접 준다.

**하지 말 것**: "슬러그가 SEO 에 좋다" 를 근거로 스킴을 되돌리자는 제안을 받아들이지 않는다. 근거가 없다. 되돌리려면 사용자 이해(공유 URL 가독성)를 근거로 PRD 를 새로 연다.

## 2. ID 방식 비교 (2026-10-19 논의)

| 방식 | 예 | 토론철 판정 |
|---|---|---|
| 10진수 PK | `/issue/26` | 가독성 최고. 기각 사유: 대량 엔티티 전제에서 길이 |
| **소문자 base36** | `/issue/q` | **채택.** 100만 = 4자. 현재 링크와 인코딩 동일 |
| base62 | `/issue/Q` | ✗ 대소문자 혼용 — Google 은 대소문자 구분, 도구가 소문자화하면 충돌 |
| Sqids/Hashids | `/issue/jR3kq` | 개수·순서 은닉이 필요할 때만. 현재 불필요(전부 공개 콘텐츠, 사이트맵으로 공개) |
| nanoid · UUID · ULID | `/issue/01HF8…` | 백엔드 별도 컬럼 필요, URL 에 김 |

base36 은 **은닉이 아니다** — 누구나 디코딩한다.

## 3. 다국어 URL — 확인한 것

| 출처 | 내용 | 신뢰도 |
|---|---|---|
| Google 다국어 사이트 관리 | ccTLD / 서브도메인 / **하위 디렉터리(유지보수 최저)** / 파라미터(**"Not recommended"**). **언어별로 다른 URL**, 쿠키·브라우저 설정 의존 금지. **"Avoid automatically redirecting"**, **"Don't use IP analysis to adapt your content"**. 현지어 URL 단어 허용 | ✅ (2025-12-10) |
| Google hreflang | HTML/HTTP 헤더/사이트맵. **상호 참조 필수**(안 하면 무시), **절대 URL**, ISO 639-1, `x-default`. 번역된 페이지는 중복 아님(본문 미번역 시만 중복) | ✅ (2026-09-21) |
| Google locale-adaptive | Googlebot 은 **`Accept-Language` 없이**, 기본 **미국 IP** 로 크롤링. **로케일별 URL 분리 + hreflang 권장** | ✅ (2025-12-10) |
| Google 스팸 정책 | scaled content abuse 예시에 **"automated transformations like synonymizing, translating"** — 스크랩 콘텐츠로 가치 없는 페이지를 대량 생성하는 맥락 | ✅ (2026-08-28) |
| Bing | hreflang 을 거의 쓰지 않고 `content-language` 메타·`<html lang>` 을 본다 | ⚠ (2차 자료, 전직 직원 발언 재인용) |
| Naver | 다국어·hreflang 공식 가이드 **없음** | ✅ (가이드 목록 확인) |
| AI 검색 4종 | 다국어 공식 지침 **없음** | ✅ |
| **Next.js 16.3 i18n 가이드** | `proxy.js` 에서 `Accept-Language` 로 로케일 리다이렉트하는 예시 — **Google 지침과 충돌. 따르지 않는다** | ✅ (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`) |

## 4. 다른 서비스의 실제 방식

| 서비스 | 방식 | 의미 |
|---|---|---|
| 나무위키 | 한국어 단일, 제목 = URL 키(`/w/3대 특검`) | 다국어 아님. 한글 URL 이 색인·순위에 불리하지 않다는 실례 |
| X · 인스타그램 | URL 하나, UI 만 번역, 본문은 원문 | 검색엔진은 원문만 색인 ⚠(관찰) |
| **X (2026-04~)** | Grok 자동 번역을 탭 없이 표시, 언어별 끄기, 외국어 게시물 추천. 내부 구현 비공개 | **토론철이 택한 모델** — 원문 단일 + 보기 계층 번역 (PRD §5.6) ◐(TechCrunch·공식 계정 발표) |
| 레딧 | 기계 번역 페이지를 `?tl=de` 별도 URL + hreflang 으로 **색인** | 2026-03~06 Reddit 인용의 5.7%, Google AI Overview 독일어 Reddit 인용의 52% ⚠(Peec, 벤더 연구). 저품질 번역 불만·`?tl=` 제거 확장 존재. **토론철은 택하지 않는다** |

## 5. 출처

- Google: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) · [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) · [AI features](https://developers.google.com/search/docs/appearance/ai-features) · [Common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) · [Multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) · [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions) · [Locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages) · [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Bing: [Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- Naver: [검색 친화적인 URL 구축하기](https://searchadvisor.naver.com/guide/seo-advanced-url)
- OpenAI: [Crawlers](https://developers.openai.com/api/docs/bots) · [Publishers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
- Anthropic: [About Claude's web crawler](https://support.claude.com/en/articles/8896518)
- Perplexity: [Crawlers](https://docs.perplexity.ai/guides/bots)
- X: [TechCrunch 2026-04-08](https://techcrunch.com/2026/04/08/x-is-rolling-out-automatic-translation-and-photo-editing-powered-by-grok/) · [Nikita Bier 발표](https://x.com/nikitabier/status/2041335306331549699)
- Reddit: [Peec](https://peec.ai/blog/reddit-machine-translated-pages-ai-visibility) · [GSQI](https://gsqi.com/marketing-blog/reddit-ai-translations-google)
