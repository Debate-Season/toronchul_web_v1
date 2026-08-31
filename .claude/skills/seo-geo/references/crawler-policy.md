# 크롤러 정책 — robots.txt · AI 봇 · Naver

> **언제 읽나** — `src/app/robots.ts` 를 쓰거나 고칠 때, AI 봇 허용/차단을 판단할 때, 네이버 색인이 안 될 때.
> 원본: `docs/ideation/seo-geo-skill-research.md` §4·§6 · PRD §6.3
>
> 신뢰도: ✅ 검증됨 · ◐ 1차 출처 확보 · ⚠ 블로그(방향성만)

---

## 1. AI 봇 차단은 GEO 레버가 아니다 — 라이선스 결정이다

이전 SKILL.md 는 "AI 봇 3계층"을 GEO 원칙으로 뒀다. **그 배치가 틀렸다.**

- **GPTBot 을 차단해도 ChatGPT 인용은 막히지 않는다.** 콘텐츠가 Common Crawl 과 Bing 인덱스를 통해 도달한다 ◐
- **AI Mode 피인용 도메인의 51.9%가 AI 크롤러를 1종 이상 차단 중**이다(전체 표본 15% 대비). 차단 도메인이 오히려 **3.5배 더 인용된다** — Google 의 그라운딩은 AI 전용 크롤러가 아니라 **자기 인덱스**를 읽기 때문 ◐
- **AI Overviews/AI Mode 접근 통제는 Googlebot 의 robots.txt** 다. AI 전용 토큰이 따로 없다 → **AI Overviews 만 빼고 Google 검색에 남는 것은 불가능**(Google 공식) ◐
- **Google-Extended · Applebot-Extended 는 HTTP 요청을 하지 않는 robots.txt 전용 opt-out 토큰**이다. 로그에 절대 안 남고, 차단해도 Google 검색 순위나 Siri/Spotlight 노출에 영향 없다 ◐

**따라서**: 학습 봇 차단은 **인용률을 지키는 조치가 아니라 콘텐츠 라이선스 정책**이다. 토론철이 정식 인터넷신문사 등록을 목표로 한다면 이건 **법무·사업 결정**이지 SEO 결정이 아니다. SEO 관점에서 차단/허용 어느 쪽도 권고하지 않는다 — 결정된 정책을 robots.txt 에 정확히 옮기는 것만 한다.

## 2. 그래도 지켜야 할 실무 사실

- **retrieval 봇과 training 봇은 벤더별로 따로 제어된다** — GPTBot↔OAI-SearchBot, ClaudeBot↔Claude-SearchBot. **하나의 규칙으로 세 결정을 담을 수 없다** ◐
- **user-triggered fetcher 는 robots.txt 를 지키지 않는다** — OpenAI 는 ChatGPT-User 에 "robots.txt 규칙이 적용되지 않을 수 있다"고 문서화, Google 도 fetcher 는 일반적으로 robots.txt 를 무시한다고 명시. **Anthropic 의 Claude-User 만 예외적으로 준수** ◐
  → **robots.txt 를 접근 통제로 착각하지 말 것.** 진짜로 막아야 하면 서버에서 막는다.
- **선언과 집행이 어긋난다** — robots.txt 에서 GPTBot 을 Disallow 한 사이트의 **39.5%가 실제로는 200 을 반환**했고, 5.5%는 선언 없이 차단하고 있었다 ◐
  → **robots.txt 감사만으로는 검증 불가.** `scripts/audit.sh` 의 봇 UA ↔ 브라우저 UA 페어 요청으로 실측한다.
- **크롤 볼륨은 여전히 Googlebot 지배** — 2026-01 Cloudflare 기준 고유 URL 도달 수가 ClaudeBot 의 1.70배, GPTBot 의 1.76배, **PerplexityBot 의 167배** ◐
  → AI 봇 세부 튜닝보다 **Googlebot 이 읽는 HTML 의 품질**이 압도적으로 중요하다.
- **뉴스 발행사는 차단 비율이 높다** — Tranco 상위 1만 도메인 차단률 10.3% vs **뉴스 발행사 56.4%** ◐. AI 뉴스를 하게 되면 업계 관행이 이쪽이라는 참고 사실.
- **Cloudflare 2026-09-15 기본값 변경** ⚠ — 광고를 게재하는 페이지에서 "mixed-use" AI 크롤러를 **기본 차단**. 신규 고객·신규 사이트·전체 무료 플랜 적용.
  → 토론철은 현재 Vercel 이다. **Cloudflare 를 도입하면 기본값이 우리 의사와 무관하게 정책을 정한다.** 도입 시 반드시 확인.
- **AI 크롤러 트래픽의 50% 이상이 변경되지 않은 페이지 재수집** ⚠ → 정확한 `lastmod` · ETag · 조건부 요청 위생이 대량 페이지(= AI 뉴스)에서 실질 이득.

---

## 3. Naver — 별도 축이다

출처: arfadia (2026-08 추정) ⚠. **한국어 사이트에 직접 적용되는 규칙이라 우선순위가 높지만, 단일 블로그 출처다.**

1. **`Yeti` 를 robots.txt 에 이름으로 명시해야 한다. [P0]**
   Googlebot·Bingbot 만 이름으로 허용하고 restrictive default 로 떨어지는 구성은 **Naver 를 통째로 차단한다.**
   → 틀렸을 때의 비용이 비대칭이다(명시해서 손해 없음, 누락하면 국내 검색 전멸). **출처가 약해도 규칙으로 채택한다.**

2. **색인이 자동이 아니다.** 등록 절차가 명시적이다:
   ```
   Naver Search Advisor 도메인 등록
     → 소유권 확인  (HTML 파일 업로드 방식 권장 — public/naver*.html)
     → sitemap.xml 제출
     → RSS/Atom 피드 제출        ← 사이트맵만으로는 부족
     → 색인 요청
   ```
   **RSS/Atom 은 아직 토론철에 없다.** AI 뉴스가 생기면 특히 필요하다.

3. **한국어 메타 길이는 영어의 절반** ⚠ — title 약 **40자**, description 약 **80자**(double-byte 한글 기준).
   → **미검증 항목이다.** Naver Search Advisor 공식 가이드로 재확인 전까지 하드 규칙이 아니라 권고로 다룬다. 확인되면 ✅ 로 승급.

4. **클라이언트 렌더·인터랙션 게이팅 콘텐츠가 Naver 색인 실패의 주원인** ⚠ — 클릭/스크롤/탭 뒤에 로드되는 내용. 해결은 SSR/프리렌더.
   → RSC 전환의 근거를 하나 더 준다. 토론철의 스레드 탭 전환이 정확히 이 패턴이다.

5. **Naver 의 schema.org 사용 여부는 공개 근거 없음** — 넣어서 손해는 없지만 **"Naver 때문에 스키마를 넣는다"고 주장하면 안 된다.**

### 소유확인 파일 취급

`public/naverc603b1549328b2b2acfd4d695ffff2d6.html` (2026-09-01 배포). 규칙 둘:

- **robots.txt 의 어떤 Disallow 에도 걸리면 안 된다.** 걸리면 소유확인이 깨진다.
- **sitemap 에 넣지 않는다.** 색인 대상 문서가 아니다.

---

## 4. robots.ts 규칙표

```
*                allow /
                 disallow /api/  /proxy/  /relay/  /oauth/  /login
                          /settings  /profile  /onboarding  /*?*
Googlebot        allow /
Bingbot          allow /,  crawlDelay 1
Yeti             allow /,  crawlDelay 1          ← 누락 시 Naver 전멸 [P0]
Daumoa           allow /
소셜 스크래퍼     facebot · Twitterbot · kakaotalk-scrap   allow
Sitemap:         {SITE_URL}/sitemap.xml
```

**AI 봇 3계층** — 값은 §1 의 라이선스 결정에서 온다. SEO 가 정하지 않는다.

| 계층 | 봇 | 의미 |
|---|---|---|
| AI 검색·인용 | OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, DuckAssistBot, YouBot, MistralAI-User | AI 답변에 인용될 경로 |
| 학습 opt-out 토큰 | Google-Extended, Applebot-Extended | HTTP 요청 없음. 차단해도 검색 영향 없음 |
| 학습 크롤러 | GPTBot, ClaudeBot, CCBot, Bytespider, meta-externalagent, DeepSeekBot, cohere-ai, Diffbot, AI2Bot | 저작권 결정 대상 |

### 절대 조건

- **`/relay/` 차단은 필수다.** PostHog 리버스 프록시 경로(v0.8.0)다. 크롤러가 수집 엔드포인트를 두드리면 분석 데이터가 오염된다.
- **`kakaotalk-scrap` 허용 유지.** 국내 유입의 상당수가 카카오톡 공유다. 막으면 링크 미리보기가 죽는다.
- **검색엔진 크롤러 전면 차단 금지.**
