# seo-geo 스킬 개선을 위한 리서치

> 조사일 2026-08-21 · 대상 24개 소스 · 목적: `.claude/skills/seo-geo/SKILL.md`(현 248줄)와 `docs/prd/v0.9.0_seo-geo.md` 개정 근거 확보
>
> **신뢰도 표기**
> - ✅ — 3인 적대적 검증 3-0 통과
> - ◐ — 1차 출처에서 원문 인용까지 확보했으나 교차검증 미완 (검증 에이전트가 세션 한도로 사망)
> - ⚠ — 블로그/2차 출처. 방향성 참고용, 규칙화 금지
>
> 조사 원본: 워크플로우 `wf_db32bb0f-f31` journal (120개 주장 중 25개만 검증 도달)

---

## 0. 결론 먼저 — 현 SKILL.md 에서 바꿔야 할 것

| # | 현재 규칙 | 근거상 문제 | 조치 |
|---|---|---|---|
| A | 원칙 20~22 GEO 3축이 근거 없이 서술됨 | Princeton GEO 논문에 **정확한 수치와 순위**가 있음. 특히 "Debate" 도메인 결과가 토론철과 정확히 일치 | 수치 인용으로 교체 (§3.1) |
| B | JSON-LD 를 GEO 레버로 암시 | Ahrefs DiD(n=1,885): AI 인용 상승 **0%**. Google 공식: "AI 기능용 특별 스키마는 없다" | 스키마 = 클래식 검색용으로 재정의 (§3.2) |
| C | 원칙 23 "학습 봇 차단" 을 GEO 항목으로 배치 | GPTBot 차단해도 Common Crawl·Bing 경유로 ChatGPT 가 인용. AI Mode 피인용 도메인의 **51.9%가 AI 크롤러를 차단 중** | GEO 가 아니라 **저작권·라이선스 결정**으로 재분류 (§4) |
| D | 원칙 15 "description 50~155자" | 한글은 double-byte. Naver 기준 **title 40자 / desc 80자** | 한국어 기준 별도 명시 (§6) |
| E | llms.txt 언급 없음 | 3개 독립 실측이 모두 "무의미" 결론. **가장 자주 요청받을 항목**이므로 명시적 거부가 필요 | "만들지 않는다 + 근거" 를 금지 사항에 추가 (§3.3) |
| F | Naver 대응 없음 | Yeti 를 robots.txt 에 **명시하지 않으면 차단됨**. Search Advisor 등록 + sitemap + **RSS/Atom 둘 다** 필요 | 신규 절 (§6) |
| G | 사이트맵 분할 방법 미기재 | Next.js 16 에서 `generateSitemaps` 의 `id` 가 **Promise 로 변경**됨 | 코드 패턴 고정 (§7.1) |
| H | 248줄 단일 파일 | 스킬 본문은 한 번 로드되면 **세션 내내 컨텍스트에 상주**. 한국어는 토큰 밀도가 높아 5k 토큰 예산 초과 가능 | `references/` 분할 검토 (§8) |
| I | audit 명령이 긴 python 원라이너 인라인 | 번들 스크립트는 **소스가 컨텍스트에 안 들어감**(stdout 만) | `scripts/audit.sh` 로 이관 (§8.3) |
| J | 폐기된 스키마 타입 목록 없음 | FAQPage 는 2026-05-07 부로 Google 리치 결과 종료. HowTo·SpecialAnnouncement 등 다수 폐기 | 폐기 목록 추가 (§3.2) |

---

## 1. 스킬 생태계 — 5개 프로젝트 구조 비교

| 프로젝트 | 구조 | 규모 | GEO 취급 | 참고할 점 |
|---|---|---|---|---|
| **AgricIDaniel/claude-seo** ✅ | 오케스트레이터 1 + 서브스킬 25 + 에이전트 18 + 커맨드 32. `skills/seo-*/`, `agents/seo-*.md` 자동 발견 | 오케스트레이터 SKILL.md **286줄** | `seo-geo` 서브스킬로 분리. 건강점수 100점 중 **10점** 배정 | `references/*.md` 를 **시작 시 로드 금지**로 명시. 교과서적 progressive disclosure |
| **claude-seo.md** ◐ | 위 저장소의 랜딩 페이지. MIT | 25 스킬 / 18 에이전트 / 32 커맨드 / 8 확장 | `/seo audit <url>` → 9개 에이전트 병렬 → 0~100 점수 | audit 진입점을 **단일 커맨드 + 팬아웃**으로 두는 패턴 |
| **claudeseoskill.com** (SNLabat/SEO-GEO-AEO-Skill) ◐ | **단일 375줄 SKILL.md**. `references/` 없음, `scripts/` 없음. ZIP 설치 | 375줄 중 **~175줄이 DOCX 디자인 스펙**(hex 색상·DXA 치수) | GEO 를 **콘텐츠 품질 속성**으로 정의 (E-E-A-T·사실 밀도·상단 명시적 주장·권위 출처 인용·엔티티 일관성) | 반면교사. 500줄 한도는 지켰으나 예산의 절반을 출력 서식에 소모 |
| **zubair-trabzada/geo-seo-claude** ◐ | 오케스트레이터 251줄 + 서브스킬 13 + 서브에이전트 5. **`references/` 디렉토리 없음** | `geo-technical` **532줄**(한도 초과), `geo-brand-mentions` 480, `geo-llmstxt` 432 | 핵심 논지 = 추출가능성. **134~167단어 자족 문단** | llms.txt 에 **432줄**을 쓰면서 Google/OpenAI 의 공식 부정 입장을 한 번도 언급 안 함 → 근거 취약. description 이 "any URL" 에도 발동하도록 트리거 과적재 |
| **searchfit-seo** ◐ | Anthropic 공식 커뮤니티 마켓플레이스 등재 (`claude plugin install searchfit-seo@claude-community`) | **10개 단일 목적 스킬**로 분해 | `ai-visibility` 를 독립 스킬로. ChatGPT·Claude·Gemini·Perplexity 4개 엔진 브랜드 노출 측정 | Anthropic 큐레이션 채널이 **다수의 좁은 스킬**을 선호한다는 신호 |

**공통 패턴**: 성숙한 구현일수록 (1) 하나의 큰 SKILL.md 가 아니라 오케스트레이터+서브스킬, (2) GEO 를 SEO 안에 녹이지 않고 **별도 스코프**로 분리, (3) 스키마 생성도 독립 스킬.

**토론철에의 함의**: 우리는 스킬 하나로 충분하다. 5개 프로젝트는 모두 **범용 SEO 도구**(임의의 사이트 대상)라 분해가 필수지만, 우리 스킬은 단일 리포·4개 엔티티에 고정돼 있다. 다만 참조 문서 분할(§8)은 그대로 가져올 가치가 있다.

---

## 2. Anthropic 공식 스킬 스펙 (4개 1차 출처 교차)

| 항목 | 규정 | 출처 |
|---|---|---|
| frontmatter 필수 | `name`(≤64자, 소문자·숫자·하이픈, 디렉토리명과 일치, "anthropic"/"claude" 금지), `description`(≤1024자, 비어있지 않음) — **딱 둘** | agentskills.io/specification ◐, skill-creator ◐ |
| frontmatter 선택 | `license`, `compatibility`(≤500자), `metadata`, `allowed-tools`(실험적) | agentskills.io ◐ |
| SKILL.md 길이 | **500줄 미만**. 단, skill-creator 는 이를 **하드 캡이 아니라 "계층을 하나 더 추가하라는 신호"** 로 규정 | code.claude.com/docs/skills ◐, skill-creator ◐ |
| 본문 토큰 예산 | **5,000 토큰 미만 권장** (줄 수보다 이쪽이 실질 기준) | agent-skills/overview ◐ |
| progressive disclosure | 3계층 — ①metadata ~100토큰 상시 로드 ②SKILL.md 본문 트리거 시 ③`scripts/`·`references/`·`assets/` 온디맨드(0토큰) | overview ◐, skill-creator ◐ |
| 참조 깊이 | **1단계까지**. 중첩 참조 체인 금지. 300줄 넘는 참조 파일엔 목차 | agentskills.io ◐, skill-creator ◐ |
| description 작성 | **3인칭**. "무엇을 하는가 + 언제 쓰는가" 둘 다 필수. 트리거 키워드 포함. 발동 부족을 막기 위해 다소 **"들이대는(pushy)"** 톤 권장 | best-practices ◐, skill-creator ◐ |
| description 절단 | `description` + `when_to_use` 합산 **1,536자에서 잘림** → 핵심 용례를 맨 앞에 | code.claude.com ◐ |
| 스킬 생명주기 | **한 번 로드되면 세션 내내 컨텍스트 유지**, 이후 턴에 다시 읽지 않음 → 모든 줄이 반복 비용. 자동 압축 후에는 스킬당 앞 5,000토큰만, 합산 25,000토큰 예산으로 재부착 | code.claude.com ◐ |
| 스크립트 번들링 | 스크립트 소스는 **컨텍스트에 들어가지 않고 stdout 만 들어감** → 동일 코드를 Claude 가 생성하는 것보다 엄격히 효율적 | overview ◐ |
| 스크립트 권한 | `allowed-tools` 의 Bash 규칙과 본문 호출 명령에 **동일한 `${CLAUDE_SKILL_DIR}` 경로**가 나타날 때만 권한 프롬프트 없이 실행 | code.claude.com ◐ |
| 스타일 경고 | 대문자 ALWAYS/NEVER 남발과 과도하게 경직된 구조는 **yellow flag**. 이유를 설명하는 서술로 바꿀 것 | skill-creator ◐ |

**우리 스킬 대조**
- 줄 수 248 → 한도 내. 하지만 **토큰 기준으로는 재야 한다**(한국어 밀도).
- frontmatter 는 `name` + `description` 만 사용 → 규격 준수.
- description 은 3인칭·트리거 키워드 포함 → 준수.
- `references/`·`scripts/` **미사용** → 개선 여지 (§8).
- 금지 사항 27개 나열은 skill-creator 의 "경직된 구조" 경고에 걸린다. 다만 우리 리스트는 대부분 **되돌릴 수 없는 사고**(색인된 URL 변경, OAuth 경로 침범)를 막는 것이므로 유지가 맞다. 대신 "왜"를 붙인 항목만 남기고 자명한 것은 정리.

---

## 3. GEO/AEO 실증 근거

### 3.1 Princeton/Georgia Tech/IIT Delhi GEO 논문 (arXiv 2311.09735, KDD '24) ◐

GEO-bench 10,000 질의 실측. **우리 원칙 20~22를 수치로 대체할 수 있는 유일한 1차 출처.**

| 기법 | 효과 |
|---|---|
| **Cite Sources**(출처 인용) · **Quotation Addition**(신뢰할 만한 인용문) · **Statistics Addition**(구체 통계) | Position-Adjusted Word Count **+30~40%**, Subjective Impression **+15~30%** — 상위 3위 |
| **Fluency Optimization**(가독성 개선, 정보 추가 없음) · Easy-to-Understand | **+15~30%**. 정보량이 아니라 **제시 방식**만 바꿔도 오름 |
| Fluency + Statistics 결합 | 단일 기법 대비 **+5.5% 초과** |
| Authoritative(권위적 어조) | 유의미한 개선 **없음** — 단, 도메인별 예외 있음(아래) |
| **Keyword Stuffing** | 개선 없음. Perplexity 실측에서는 **베이스라인보다 10% 나쁨**(21.9 vs 24.1) |

**도메인별 분화 — 토론철과 직결**

| 도메인 | 최적 기법 | 토론철 매핑 |
|---|---|---|
| **Debate**, History | **Authoritative** 가 유의미하게 개선 | **토론 페이지** — 여기서만 권위적 어조가 먹힌다 |
| Law & Government, **Debate**, **Opinion** | **Statistics Addition** | 토론 페이지의 찬반 수치·참여자 수 |
| Statement / Facts | **Cite Sources** | 이슈위키·사건 페이지 |
| People & Society, Explanation, History | **Quotation Addition** | 이슈 맥락 설명 |

**저순위 사이트가 더 크게 얻는다**: 모든 출처를 동시 최적화했을 때 SERP 5위 사이트는 Cite Sources 로 **+115.1%**, 반면 1위 사이트는 평균 **−30.3%**. 생성 엔진은 백링크·도메인 권위가 아니라 **페이지 내용에 조건화**되기 때문. → 신생 도메인인 토론철에 유리한 구조.

### 3.2 schema.org 는 AI 인용을 만들지 않는다

**Ahrefs 인과 연구** (2026-05-11, 1차) ◐ — 600만 URL 검토 → JSON-LD 를 새로 추가한 **1,885 페이지** vs 대조군 4,000 페이지, difference-in-differences + 이벤트 스터디 + 민감도 분석:

| 플랫폼 | AI 인용 변화 |
|---|---|
| Google AI Mode | **+2.4%** (0과 구분 불가) |
| ChatGPT | **+2.2%** (0과 구분 불가) |
| Google AI Overviews | **−4.6%** (작지만 통계적으로 유의한 *하락*) |

흔히 인용되는 "AI 인용 페이지의 53%가 JSON-LD 보유(비인용 대비 3배)" 라는 상관관계는 **인과 검증을 통과하지 못한다** — 다른 품질·권위 신호와 교란돼 있다.

**중요한 한계(우리에게 유리한 쪽)**: 처치군 전원이 처치 전 이미 AI Overviews 인용 100회 이상인 페이지였다. 따라서 **"AI 에게 아예 안 보이던 페이지가 스키마로 발견되는가"는 이 연구가 답하지 못한다.** 토론철은 정확히 그 미발견 구간에 있다.

**Google 공식** (developers.google.com/search/docs/appearance/ai-features, 2025-12-10 갱신) ◐
> AI Overviews·AI Mode 에 나타나기 위한 추가 요건은 없고, 특별한 최적화도 필요 없다. 새로운 기계 판독 파일·AI 텍스트 파일·마크업을 만들 필요가 없다. **필요한 특별 schema.org 구조화 데이터도 없다.**

**결론**: 스키마는 **클래식 검색의 리치 결과·엔티티 인식·음성 어시스턴트**를 위해 넣는다. GEO 레버로 정당화하지 않는다. Ahrefs 도 "이미 노출되는 페이지의 AI 인용을 늘리려는 목적이라면 데이터가 그 베팅을 지지하지 않는다"고 명시.

**폐기된 스키마 타입** (claude-seo 유지 목록) ✅
- **FAQPage** — 2026-05-07 부로 전 사이트 대상 Google FAQ 리치 결과 중단. Google 리치 결과 이득 **0**
- HowTo(2023-09 제거) · SpecialAnnouncement(2025-07) · ClaimReview · VehicleListing · EstimatedSalary · LearningVideo · CourseInfo 캐러셀(2025-06 일괄 폐기)
- 유효: Organization, Article, Product, LocalBusiness, Event, JobPosting, Course, SoftwareApplication, Service, Q&A, Video

### 3.3 llms.txt — 만들지 않는다 (3개 독립 실측 + 공식 입장)

| 출처 | 측정 | 결과 |
|---|---|---|
| **Ahrefs** (2026-06-15, 1차) ◐ | 137,210 도메인, 2026-05 한 달 | 28%가 llms.txt 발행. 그중 **97%가 한 달간 fetch 0회**. 파일이 없는 도메인에 AI 봇이 요청한 사례 **0건**(= 발행이 탐색을 유발하지 않음). 실제로 읽는 건 GPTBot·Claude-Code 같은 **코딩/학습 에이전트**이고, OAI-SearchBot+PerplexityBot+Claude 검색봇 합계는 수백 회. **Slackbot 이 PerplexityBot 보다 많이 가져갔다** |
| **cittago 로그 실측** (2026-08-09) ⚠ | Cloudflare 로그 23시간, 19,489 요청 | `/llms.txt` **4회** vs `/robots.txt` 95회 vs `/sitemap.xml` 26회. 4회 중 3회가 **저자 본인의 curl**. ClaudeBot 은 robots.txt 11회·sitemap 11회 가져가면서 llms.txt **0회**. PerplexityBot 도 **0회** |
| **hasdata** (2026-07-24, 1차) ◐ | 10,894 도메인 | 채택률 **7.4%**(뉴스 발행사는 3.2%). OpenAI·Anthropic·Google·Perplexity **전부 robots.txt 는 읽지만 llms.txt 를 읽겠다고 약속한 곳은 없음** |
| **Google (John Mueller)** ✅◐ | 공식 발언 | "아무도 모른다 — 지금으로선 순전히 추측이다. 파일은 수년째 존재하는데 어떤 AI 시스템도 쓰지 않는다." Google 은 대신 **WebMCP** 를 밀고 있음 |

**결정적 반증 실험 — cats.txt** (Mark Williams-Cook, 2026-08-07) ⚠
완전히 허구인 `cats.txt` 표준을 만들었더니 PerplexityBot·GPTBot·ClaudeBot·Googlebot 이 **크롤했고**, Google 이 **색인했고**(Search Console 소유권 확인까지 제안), ChatGPT 는 **"순위에 도움이 된다"고 긍정 답변**했다. → **크롤 사실·색인 사실·LLM 의 긍정 답변은 효능의 증거가 아니다.** llms.txt 지지 논거 4종이 모두 이 세 가지에 의존한다.

**우리 조치**: 금지 사항에 "llms.txt 를 만들지 않는다 — 근거 §3.3" 을 명시. 요청이 들어오면 이 절을 인용해 거절하고, 대신 robots.txt/sitemap 정합성에 시간을 쓴다.

### 3.4 AI 인용과 검색 순위의 관계 (originality.ai, 2025-11-18) ⚠

- AI Overviews 인용의 **48%만** Google 상위 100위와 겹친다 → 나머지 절반은 **100위 밖에서 인용**된다. "순위가 인용의 전제조건"은 과장.
- 그러나 순위가 있으면 확률이 크게 오른다: 1위 **57.91%**, 10위 **38.09%**, 30위 **21.47%**. 순위 매칭된 인용의 **약 90%가 상위 30위 안**.
- 저자 결론: AI Overviews 는 **이미 권위 있는 소수 발행사에 가시성을 집중**시킨다 → 신생 사이트에 역풍.

**§3.1(저순위 사이트가 GEO 로 더 얻는다)과 겉보기 충돌**. 해석: 생성 엔진이 **후보 문서를 이미 확보한 뒤**의 인용 선택은 내용 기반이라 저순위가 유리하지만(GEO 논문), **후보에 들어가는 단계**는 여전히 검색 인덱스가 지배한다(originality). → **클래식 색인이 선행 조건, GEO 는 그 위의 증폭기.** 우리 PRD 의 "본문 30자 → 500자+" 목표가 여전히 P0 인 이유.

---

## 4. AI 크롤러 정책 — 2026년 실태

### 4.1 차단은 GEO 레버가 아니다

- **GPTBot 을 차단해도 ChatGPT 인용은 막히지 않는다** — 콘텐츠가 Common Crawl 과 Bing 인덱스를 통해 OpenAI 모델에 도달한다 ◐
- **AI Mode 피인용 도메인의 51.9%가 AI 크롤러를 1종 이상 차단 중**(전체 표본 15% 대비). 차단 도메인이 오히려 **3.5배 더 인용**된다 — Google 의 그라운딩은 AI 전용 크롤러가 아니라 **자기 인덱스**를 읽기 때문 ◐
- **AI Overviews/AI Mode 접근 통제는 Googlebot 의 robots.txt** 다. AI 전용 토큰이 따로 없다 → **AI Overviews 만 빼고 Google 검색에 남는 것은 불가능** (Google 공식) ◐
- **Google-Extended / Applebot-Extended 는 HTTP 요청을 하지 않는 robots.txt 전용 opt-out 토큰**이다. 로그에 절대 안 남고, 차단해도 Google 검색 순위나 Siri/Spotlight 노출에 영향 없다 ◐

→ **현 SKILL.md 원칙 23("AI 봇 3계층")을 GEO 절에서 빼야 한다.** 학습 봇 차단은 인용률을 지키는 조치가 아니라 **콘텐츠 라이선스 정책**이다. 토론철이 정식 인터넷신문사 등록을 목표로 한다면 이건 법무·사업 결정이지 SEO 결정이 아니다.

### 4.2 그래도 지켜야 할 실무 사실

- **retrieval 봇과 training 봇은 벤더별로 따로 제어된다** — GPTBot↔OAI-SearchBot, ClaudeBot↔Claude-SearchBot. 하나의 robots 규칙으로 세 결정을 담을 수 없다 ◐
- **user-triggered fetcher 는 robots.txt 를 지키지 않는다** — OpenAI 는 ChatGPT-User 에 대해 "robots.txt 규칙이 적용되지 않을 수 있다"고 문서화, Google 도 "fetcher 는 일반적으로 robots.txt 를 무시한다"고 명시. **Anthropic 의 Claude-User 만 예외적으로 준수** ◐
- **선언과 집행이 어긋난다** — robots.txt 에서 GPTBot 을 Disallow 한 사이트의 **39.5%가 실제로는 200 을 반환**했고, 5.5%는 선언 없이 차단하고 있었다. robots.txt 감사만으로는 검증 불가, **동일 IP·봇 UA vs Chrome UA 페어 요청 실측**이 필요 ◐ → audit 명령에 추가할 것
- **크롤 볼륨은 여전히 Googlebot 지배** — 2026-01 Cloudflare 분석 기준 고유 URL 도달 수가 ClaudeBot 의 1.70배, GPTBot 의 1.76배, PerplexityBot 의 **167배** ◐
- **뉴스 발행사는 차단 비율이 높다** — Tranco 상위 1만 도메인의 AI 크롤러 차단률 10.3%(GPTBot 7.9%) vs **뉴스 발행사 56.4%**(GPTBot 50.5%). 약 5배 ◐
- **Cloudflare 2026-09-15 기본값 변경** — 광고를 게재하는 페이지에서 "mixed-use" AI 크롤러를 **기본 차단**. 신규 고객·신규 사이트·전체 무료 플랜에 적용. Pay Per Crawl → Pay Per Use 로 전환 ⚠ → 토론철이 Cloudflare 를 쓰게 되면 **기본값이 우리 의사와 무관하게 정책을 정한다**. 도입 시 확인 필요
- **AI 크롤러 트래픽의 50% 이상이 변경되지 않은 페이지 재수집** ⚠ → 정확한 `lastmod`·ETag·조건부 요청 위생이 대량 페이지 사이트에서 실질 이득

---

## 5. 대량 발행 리스크 (일 1,000건 AI 기사)

**Google scaled content abuse** (2024-03 스팸 정책) — AI 생성 자체를 금지하지 않는다. **규모로 생성되고 실질 가치가 없는 페이지**가 대상. 판정은 생성 방식이 아니라 **페이지당 가치** ⚠

> 이하는 블로그(digitalapplied, 2026-03-08) 주장이며 Google 공식 수치가 아니다. **규칙이 아니라 방향성으로만 취급할 것.**

- 지속적으로 **일 10건 이상** 발행하면 자동 생성 신호로 취급된다는 주장 → 계획된 1,000건/일은 이 주장의 **100배**
- 지속 가능 상한을 "인간 편집 기준선의 2~4배"로 제시(5인 팀 기준 주 10~15건) → 주 수십 건 규모
- **AI 리라이트를 발행하는 뉴스 애그리게이터가 최대 피해 카테고리**로 지목, 트래픽 50~75% 손실 주장 — 토론철 AI 뉴스와 가장 가까운 패턴
- 탐지가 다신호라는 주장: 페이지 간 의미 유사도, 인게이지먼트, **발행 속도**, 저자 자격 정보 부재, 원본 미디어·자체 조사 부재

**우리 PRD §5.4 의 "등록 전 Disallow → 인터넷신문 등록 후 색인" 전략은 이 리스크에 대해 옳은 방향이다.** 다만 근거를 블로그가 아니라 **Google 스팸 정책 원문**으로 교체해야 한다. 완화책으로 §3.1 의 Statistics/Cite Sources 는 그대로 유효하다 — **자체 데이터(찬반 수치·커뮤니티 분포)는 토론철만 가진 원본 자산**이고, 이게 "원본 조사 부재" 신호를 정면으로 상쇄한다.

---

## 6. Naver — 현 스킬에 완전히 빠져 있는 축 ⚠

출처: arfadia (2026-08 추정, 블로그). **한국어 사이트에 직접 적용되는 checkable 규칙이라 우선 확인 필요.**

1. **Yeti 를 robots.txt 에 명시해야 한다.** Googlebot·Bingbot 만 이름으로 허용하고 restrictive default 로 떨어지는 구성은 **Naver 를 통째로 차단한다** → 우리 `src/app/robots.ts` 설계 시 P0
2. **색인이 자동이 아니다.** Naver Search Advisor 에 도메인 등록 → 소유권 확인 → **sitemap 과 RSS/Atom 피드 둘 다 제출** → 색인 요청. 사이트맵만으로는 부족
3. **한국어 메타 길이는 영어의 절반** — title 약 **40자**, description 약 **80자** (double-byte 한글 기준) → 현 SKILL.md 원칙 15 의 "50~155자"와 충돌. 한국어/영어 기준을 분리해야 함
4. **클라이언트 렌더·인터랙션 게이팅 콘텐츠가 Naver 색인 실패의 주원인** — 클릭/스크롤/탭 뒤에 로드되는 내용. 해결은 SSR/프리렌더 → 우리 RSC 전환의 근거를 하나 더 확보
5. **Naver 의 schema.org 사용 여부는 공개 근거 없음** — 넣어서 손해는 없지만 Naver 효과를 주장하면 안 됨

**검증 필요**: 3번(40자/80자)은 블로그 단일 출처다. Naver Search Advisor 공식 가이드로 재확인 후 규칙화할 것.

---

## 7. Next.js 16 구현 사실

### 7.1 사이트맵 분할 (nextjs.org 공식) ◐

- `generateSitemaps` 가 한 라우트의 사이트맵을 여러 파일로 분할, `/.../sitemap/[id].xml` 로 서빙 (예: `/issue/sitemap/1.xml`)
- 공식 문서가 **Google 한도를 사이트맵 파일당 50,000 URL** 로 명시, 표준 패턴은 `id * 50000` 슬라이싱
- **Next.js 16 파괴적 변경**: `id` 가 **Promise 로 전달**된다 → `const id = await props.id`. 이전 버전의 평문 값 시그니처를 쓰면 깨진다
- 15.0.0 이후로 dev/prod URL 형태가 일치(그 이전 13.3.2 는 dev 에서 `/.../sitemap.xml/[id]`)

일 1,000건 × 1년이면 36.5만 URL → 뉴스만 8개 샤드. **PRD §6 에 이 코드 시그니처를 고정해 둬야 한다.**

---

## 8. 스킬 파일 구조 개선안

### 8.1 현재 상태
248줄 단일 `SKILL.md`. `references/`·`scripts/`·`assets/` 없음.

### 8.2 분할 후보

```
.claude/skills/seo-geo/
├── SKILL.md                      # 시작 절차 + 핵심 원칙 + 작업 모드 (~150줄 목표)
├── references/
│   ├── schema-map.md             # 엔티티별 JSON-LD 매핑 + 폐기 타입 목록 + 함정
│   ├── geo-evidence.md           # §3 요약 — GEO 기법 순위, schema 무효, llms.txt 거부 근거
│   ├── crawler-policy.md         # §4 — AI 봇 실태, Naver Yeti, robots 규칙표
│   └── geo-content-patterns.md   # 정의형 문단·통계 블록·진행 경과 템플릿
└── scripts/
    └── audit.sh                  # 크롤러 본문 추출 + robots/sitemap 확인 + grep 위반 검사
```

근거: 참조 파일은 **읽기 전까지 0토큰**, 스크립트는 **소스가 컨텍스트에 안 들어감**. 스킬 본문은 한 번 로드되면 세션 내내 상주하므로 상시 필요한 것만 남긴다.

**주의**: 참조는 1단계까지만(중첩 금지), SKILL.md 가 각 파일이 무엇을 담고 언제 읽어야 하는지 **명시적으로 링크**해야 한다. claude-seo 처럼 "시작 시 전부 로드 금지"를 문장으로 박아둘 것.

### 8.3 스크립트 번들링 시 주의
권한 프롬프트 없이 실행되려면 `allowed-tools` 의 Bash 규칙과 본문 호출 명령에 **같은 `${CLAUDE_SKILL_DIR}` 경로 문자열**이 나와야 한다. 한쪽만 쓰면 매번 승인 요청이 뜬다.

### 8.4 판단
분할은 **이득이 있지만 지금은 아니다.** 248줄은 아직 여유가 있고, 구현이 시작되기 전에 구조를 흔들면 PRD 와의 대응이 깨진다. **v0.9.0 구현 중 SKILL.md 가 350줄을 넘는 시점**을 분할 트리거로 잡는다.

---

## 9. 미해결 / 추가 조사 필요

| 항목 | 왜 미해결인가 |
|---|---|
| Naver 메타 길이 40자/80자 | 블로그 단일 출처. Naver Search Advisor 공식 가이드 확인 필요 |
| scaled content 발행 속도 임계 | 블로그 주장(일 10건). Google 공식 문서에는 수치가 없음. **수치를 규칙화하지 말 것** |
| 채팅 원문 색인 사례 | 이전 턴 조사(Linen.dev·Chatsindex 등)와 별개로, **한국 커뮤니티 판례·개인정보 이슈**는 미조사. PRD §7-2 |
| Cloudflare 2026-09-15 기본값 | 토론철 인프라가 Cloudflare 를 경유하는지 미확인 |
| 스키마가 **미발견** 페이지의 AI 발견을 돕는가 | Ahrefs 연구 범위 밖. 토론철이 정확히 이 구간 — 우리 자체 데이터로만 답할 수 있음 |
| 워크플로우 검증 미완 | 120개 주장 중 25개만 3인 검증 도달(6 confirmed / 1 refuted). 나머지는 1차 출처 원문 인용까지만 확보 |

---

## 10. 참고 소스 전체

**스킬 생태계**
- https://github.com/AgricIDaniel/claude-seo · https://claude-seo.md/
- https://github.com/zubair-trabzada/geo-seo-claude
- https://www.claudeseoskill.com/ (SNLabat/SEO-GEO-AEO-Skill)
- https://claudeskills.info/plugins/anthropics/claude-plugins-community/searchfit-seo/

**Anthropic 공식 스펙**
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- https://code.claude.com/docs/en/skills
- https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- https://agentskills.io/specification

**GEO/AEO 실증**
- https://arxiv.org/abs/2311.09735 (Princeton GEO, KDD '24)
- https://ahrefs.com/blog/schema-ai-citations/ (스키마 인과 연구)
- https://ahrefs.com/blog/llmstxt-study/ · https://cittago.com/blog/llms-txt-cats-txt-2026/
- https://originality.ai/blog/google-ranking-ai-citations-study
- https://developers.google.com/search/docs/appearance/ai-features (Google 공식)
- https://www.searchenginejournal.com/google-says-llms-txt-is-purely-speculative-for-now/577576/

**크롤러 / 정책 / 인프라**
- https://hasdata.com/blog/ai-crawler-block-index
- https://nohacks.co/blog/ai-user-agents-landscape-2026
- https://techcrunch.com/2026/07/01/cloudflares-new-policy-pushes-ai-companies-to-pay-for-publishers-content/
- https://www.digitalapplied.com/blog/scaled-content-abuse-google-march-update-ai-pages-decimated
- https://www.arfadia.com/blog/naver-technical-seo-search-advisor/
- https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
