# BigValue SEO / GEO 전략서

> 이 문서는 **개념·원칙·pSEO 전략**을 다룬다. 실제 코드 구현, 파일 경로, 트러블슈팅, 배포 체크리스트, 현재 진행 상태는 `docs/SEO-Implementation.md`를 본다.
>
> 기준일: 2026-04-23 · 대상: `https://bigvalue.ai` · 스택: Next.js 16 (App Router)

---

## 1. SEO와 GEO — 개념 정의

### 1.1 SEO (Search Engine Optimization)

검색엔진(Google/Bing/Naver)의 크롤러가 페이지를 **수집·이해·색인·랭킹**하도록 신호를 설계하는 일. 성공 지표는 노출·CTR·순위.

### 1.2 GEO (Generative Engine Optimization)

ChatGPT Search, Perplexity, Gemini, Claude Search, Bing Copilot, Google AI Overviews 등 **생성형 AI 검색**이 BigValue 데이터를 **답변에 인용**하게 만드는 일. 성공 지표는 AI 인용율·브랜드 언급.

### 1.3 SEO vs GEO 비교

| 차원 | SEO | GEO |
|:---|:---|:---|
| 목표 | 블루 링크 순위 | AI 생성 답변에 인용 |
| 랭킹 단위 | 전체 페이지 | 개별 주장·사실·엔티티 |
| 핵심 신호 | 링크·키워드·권위 | 엔티티 명확성·사실 밀도·인용 가능성 |
| 구조화 데이터 효과 | 리치 스니펫 | LLM의 엔티티 관계 이해 |
| 성공 지표 | CTR·순위·노출 | AI 인용율·브랜드 언급 |

SEO와 GEO는 **상호 배타가 아니라 중첩**된다. JSON-LD 구조화 데이터는 양쪽 모두에 기여하고, 양질의 콘텐츠는 랭킹과 인용 모두에 유리하다.

---

## 2. SEO 인프라 5계층

대규모 pSEO 사이트(BigValue: 정적 + 동적 700만+ 페이지)를 운영하려면 **서로 다른 책임을 가진 다섯 개 레이어**가 동시에 올바르게 작동해야 한다.

| 계층 | 구성요소 | 목적 |
|:---|:---|:---|
| 1. 보안 게이트 | AWS WAF, IP Set | 악성 스크래퍼 차단 + 정상 검색/AI 봇 통과 |
| 2. 크롤 제어 | robots.txt, crawl-delay | 크롤 버짓 보호, 봇별 정책 표현 |
| 3. 페이지 신호 | metadata, JSON-LD, canonical, OG, Quality Gate | 색인·리치·엔티티 신호 |
| 4. 발견 경로 | sitemap-index, sitemap, sitemap-biz/[id], feed | 검색엔진에 URL 발견 가이드 |
| 5. 즉시 색인 | IndexNow API | 변경/신규 URL의 Bing/Yandex 즉시 푸시 |

> **WAF ↔ robots.txt 1:1 원칙**: 차단은 WAF, 안내는 robots.txt. robots.txt가 허용하는 봇을 WAF가 네트워크 레이어에서 차단하면 robots.txt 허용은 무의미해진다.

---

## 3. pSEO 대규모 운영 전략

### 3.1 기본 철학

- **크롤 버짓 보호가 최우선** — 700만 URL을 Google이 모두 크롤하는 데는 수개월~수년이 걸린다. Thin Content·파라미터 URL·느린 응답은 전부 크롤 버짓 낭비.
- **신뢰 신호는 한 번 잃으면 복구가 수 주~수 개월** — 특히 `lastmod`가 부정확하다고 판단되면 Google은 해당 신호를 영구적으로 낮게 평가한다.
- **한 번 정한 URL은 바꾸지 않는다** — 사이트맵 파일명(URL), 페이지 URL 모두. Google은 파일 URL 자체를 기억하고 주기적으로 재방문한다.
- **리다이렉트 체인 3단계 이상 금지** — `301 → 302 → 최종` 같은 체인 구조는 크롤 버짓을 과도하게 소비한다.

### 3.2 Phase별 단계적 색인 전략

현 Phase의 색인율이 **70%+** 달성된 뒤 다음 Phase URL을 확대한다. 이 원칙이 깨지면 Helpful Content Classifier가 사이트 전체를 억제할 위험이 있다.

| Phase | 대상 URL 수 | 기간 | 목표 색인율 | 비고 |
|:---|:---|:---|:---|:---|
| 1 — 정적 + 핵심 pSEO 허브 | ~1,700개 | 2~6주 | 70%+ | 랜딩·제품·산업·대시보드 허브 |
| 2 — 카페 매출/역세권 전 지역 | ~수만 | 1~3개월 | 70%+ | 시도/시군구/동, 노선/역 |
| 3 — 사업자 시도·시군구 허브 | ~수백 | 3~6개월 | — | 사업자 계층 진입 |
| 4 — 사업자 700만+ 개별 상세 | ~7M | 12~24개월 | **100% 보장 안 됨** | Phase 4는 color 페이지처럼 작동 — 색인은 롱테일로 점진적으로 진행되며 일부는 영구적으로 색인 안 될 수 있음 |

### 3.3 priority 산정 원칙

`sitemap.xml`의 `priority`는 **같은 사이트 내 URL 간의 상대적 중요도** 일 뿐, 검색 랭킹과는 무관하다. 크롤 순서·우선 대상 선정에 영향을 준다.

| 페이지 유형 | priority | changeFrequency |
|:---|:---|:---|
| Home | 1.0 | weekly |
| Products / Industry 허브 | 0.9 / 0.8 | weekly |
| Signals 리스트 | 0.8 | daily |
| 대시보드 시도 허브 | 0.8 | monthly |
| 시군구 | 0.7 | monthly |
| Signals/Newsroom 상세 | 0.6~0.7 | monthly |
| 읍면동 상세 (데이터 밀도별) | 0.5~0.8 | monthly |
| 사업자 개별 | 0.5 | monthly |

---

## 4. Canonical & metadataBase 아키텍처 원칙

### 4.1 정석 패턴 (Next.js 13+ App Router)

> **"metadataBase는 env 기반 단일 설정, 페이지 metadata는 상대 경로"**

| 관점 | 권장 |
|:---|:---|
| 최종 HTML 출력 | 절대 URL (`<link rel="canonical">`, `og:url`) |
| 소스 코드 작성 | **상대 경로** — `metadataBase`가 자동으로 절대화 |
| 도메인 출처 | env 변수 **단일 지점**, 코드 하드코딩 금지 |
| JSON-LD 내부 URL | **절대 URL 필수** — 스펙 상 요구, `${SITE_URL}${path}` prepend |

### 4.2 단일 출처 원칙이 필요한 이유

- **환경 간 색인 신호 유출 차단** — staging이 prod canonical을 뱉으면 staging 크롤이 prod GSC property로 혼입되어 색인 신호 오염
- **도메인 변경 시 누락 제로화** — 도메인이 코드 여러 곳에 박혀 있으면 변경 시 일부 누락 → canonical 불일치 → 색인 혼란
- **리팩터 단순화** — 로컬 선언 `const SITE_URL` 금지, `@/lib/seo` 단일 import

### 4.3 환경별 분리 효과

| 환경 | 빌드된 canonical |
|:---|:---|
| prod | `https://bigvalue.ai/products` |
| staging | `https://staging.bigvalue.ai/products` |
| local | `http://localhost:3000/products` |

staging 도메인이 외부에 노출되어 있다면 Googlebot이 크롤할 수 있으므로, **staging robots 전체 Disallow 또는 Basic Auth/WAF 차단**이 병행되어야 분리 효과가 완성된다.

---

## 5. JSON-LD 스키마 전략

### 5.1 선정 원칙

1. **페이지의 실제 데이터 유형에 맞는 스키마** — 사업자 상세는 단순 WebPage가 아닌 LocalBusiness, 카페 매출 분석은 Dataset
2. **화면 콘텐츠 ≡ JSON-LD 데이터** — 불일치 시 Google 페널티. FAQPage는 화면 FAQ UI와 반드시 동시 렌더
3. **`@id`로 엔티티 간 참조 연결**, **`sameAs`로 외부 프로필 연결**
4. **구체적 `@type` 선호** — `LocalBusiness` 대신 `CafeOrCoffeeShop` 등 하위 타입
5. **`dateModified` 필수** — 모든 데이터 스키마에 실제 갱신일 포함

### 5.2 스키마 체계 — 9종

| 스키마 | 적용 대상 | 선정 근거 |
|:---|:---|:---|
| Organization | 전역 | 엔티티 루트, GEO 핵심 — `sameAs`, `alternateName("빅밸류")`, `@id` |
| WebPage / CollectionPage | 정적/목록 | 기본 페이지 식별 |
| Article | Signals/Newsroom/Notice/UseCase 상세 | 콘텐츠 구조화 |
| Product | Products/* | 제품 정보 |
| BreadcrumbList | 계층 상세 페이지 | 검색 결과 경로 표시 |
| Dataset | 카페 매출/역세권 분석 | Google Dataset Search 적격 — 정량 데이터 |
| FAQPage | 분석 페이지 FAQ | 리치 스니펫, CTR↑, AI 인용↑ |
| LocalBusiness | 사업자 개별 | 지역 검색 노출, Maps 연동 |

### 5.3 Google 규격 제약 숙지 의무

새 스키마 도입 시 **https://developers.google.com/search/docs/appearance/structured-data** 에서 required/recommended 속성과 length 제약을 사전 확인한다. 과거 `Dataset.description` 50자 미달로 GSC 131건 에러 발생 경험.

---

## 6. 사이트맵 전략

### 6.1 lastmod 신뢰성이 핵심

Google은 lastmod가 실제 콘텐츠 변경과 일치하는지를 학습한다. **한 번 신뢰를 잃으면 복구에 수 주~수 개월** 이 걸리고, 전체 크롤 버짓이 저하된다.

- `new Date()` 빌드 시점 날짜 **절대 금지**
- UI/컴포넌트 코드 배포로는 **변경하지 않음**
- 데이터 소스(카드 매출 데이터, 사업자 등록, publishedAt 등)의 실제 갱신일만 사용

### 6.2 사이트맵 파일 URL 불변 원칙

한 번 정한 사이트맵 파일명은 변경하지 않는다. Google은 파일 URL 자체를 기억하고 주기적으로 재방문하므로, 파일명을 바꾸면 Google 입장에서 "기존 파일은 사라지고 새 파일이 등장한 것"으로 인식되어 크롤 스케줄이 리셋된다.

### 6.3 Naver 전용 사이트맵 분리 (선택)

Naver Yeti는 수십~수백 개 이상의 사이트맵 파일을 처리할 때 **지연**이 발생한다. 사업자 700만을 40,000 URL/파일로 분할하면 ~175개 파일이 되는데, 이는 Yeti에게 과도하다.

대응: **핵심 ~50,000 URL만 담은 `sitemap-naver.xml`** 을 별도 운영하는 것이 전략 v3의 권고안. 현재는 미구현 — Phase 2 이후 Naver 색인율이 낮으면 도입 검토.

### 6.4 사업자 사이트맵 페이지네이션

- 파일당 40,000 URL (Google 50k 제한에 여유)
- 페이지네이션 ID는 숫자 단조 증가 (`sitemap-biz/1`, `2`, ...)
- `totalPages`는 **실제 데이터 합산** 기준으로 계산 (카운트 필드와 district 합산 불일치 시 빈 페이지 발생)

### 6.5 배포 시 파일 분리의 안전 순서

신규 사이트맵 파일 추가/기존 파일 분할 시 **URL이 일시적으로 어느 사이트맵에도 없는 순간**을 방지:

1. 신규 파일 생성
2. sitemap-index에 신규 파일 추가
3. Google 인식 대기 (~수일)
4. 기존 파일에서 해당 URL 제거

---

## 7. robots.txt & AI 봇 3계층 전략

### 7.1 Crawl-Delay 근거

| 봇 | crawl-delay | 이유 |
|:---|:---|:---|
| Googlebot | 미설정 | Google이 자체 알고리즘으로 속도 조절 (crawl-delay 무시) |
| Bingbot, Yeti | 1초 | 각 사 공식 권고, **미설정 시 Naver는 크롤 거부 가능** |
| 기타 미식별 봇 | 5초 | 서버 부하 방지, 의도하지 않은 봇의 대량 크롤 제어 |

### 7.2 AI 봇 3계층 — 왜 중요한가

OpenAI·Anthropic 등 주요 AI 기업은 봇을 **학습용 / AI 검색용 / 유저 브라우징용** 으로 분리 운영한다. 각각의 역할과 정책이 다르다.

| 역할 | OpenAI | Anthropic | 정책 | 이유 |
|:---|:---|:---|:---|:---|
| 학습 데이터 수집 | GPTBot | ClaudeBot | **차단** | 학습 참여 ≠ 검색 인용. 학습 차단해도 AI 검색 인용에는 영향 없음 |
| AI 검색 인덱싱 | OAI-SearchBot | Claude-SearchBot | **허용** | 차단 시 AI 검색 결과에서 BigValue 제외됨 |
| 유저 브라우징 (실시간 접근) | ChatGPT-User | Claude-User | **허용** | 사용자 질문 시 AI가 페이지를 방문 |

**결과**: 학습 데이터는 제공하지 않으면서, AI 검색 결과에서는 BigValue 데이터가 인용되는 경로를 확보한다.

---

## 8. Thin Content 정책 — "색인 허용 + 경고 배너"

### 8.1 현 정책 (2026-04-21 전환)

표본이 작은 데이터 대시보드 페이지(카페 수 < 5 등)도 **색인 허용**. 본문 상단에 통계 해석 유의 경고 배너 제공.

### 8.2 왜 noindex를 쓰지 않는가 — 전환 배경

이전 정책(2026-04-02): 카페 < 5 동 페이지 `noindex` + sitemap 제외 → 5,197개(51.4%) 색인 제외.

이 방식의 문제:

| 문제 | 설명 |
|:---|:---|
| **Flapping** | 월 단위 데이터 갱신 환경에서 임계값 경계의 동이 색인 on/off 반복 → Google 크롤 우선순위 점수 하락, 링크 권위 리셋 |
| **롱테일 손실** | 특정 지명 검색 시 "{지역} 카페" 결과가 사라져 사용자 경험 악화 |
| **GSC 경고 증가** | "Discovered - currently not indexed" 비중 상승 → 도메인 품질 신호 저하 |

### 8.3 경고 배너 방식의 이점

- 플래핑 없음 — 임계값 변화에 색인 상태 영향 없음
- 롱테일 포착 유지 — 모든 지명 검색이 결과로 연결
- 사용자 경험 투명성 — 페이지 본문에서 표본 작음을 명시
- 통계적 한계는 **Dataset JSON-LD `description`과 본문 배너에 동일 문구로 일관되게** 기술

### 8.4 통계적 근거 — 왜 5개 기준이 맞는가

경고 배너를 띄우는 기준 (카페 < 5)의 통계적 근거:

| 카페 수 | 통계적 의미 |
|:---|:---|
| 1개 | 평균=중앙값=해당 값, 무의미 (449개 동 전수 확인) |
| 2개 | 개업시기 2범주만 분포, 비교 불가 |
| 3~4개 | 최소 범위 확인 가능, 경계선 |
| 5~9개 | 분포 형태 초보적 확인 — 제한적 유의미 |
| 10개+ | 대부분 기술통계 유효 |
| 30개+ | 중심극한정리 충족, 모든 통계 유효 |

핵심 규칙:
- **n < 5**: Tukey, APA 7판 기준 집계 통계 권장 불가
- **비율 신뢰구간 정규근사 최소조건**: np ≥ 5
- **n < 30**: CLT 미충족, t-분포 필요

### 8.5 noindex가 여전히 정당한 예외

**법적/규제적 사유만** 해당:

| 조건 | 처리 |
|:---|:---|
| 개인정보 삭제 요청 접수된 사업자 상세 | `robots: { index: false, follow: false }` + **sitemap-biz에 `isDelisted()` 필터 동시 적용** |
| 관리자/내부용 페이지 | robots + `/admin` 경로 robots.txt 차단 |
| 중복/정규화가 불가한 테스트 페이지 | noindex + sitemap 제외 |

### 8.6 동기화 원칙 (불변)

noindex를 적용하는 페이지가 존재하면 **반드시 sitemap 생성 로직에도 동일 필터**를 추가한다. 한쪽만 적용 시 "크롤하라 + 색인하지 마라" 모순 신호가 Google에 전달된다. PR 단위 동시 수정 강제.

---

## 9. GEO 전략 — 3가지 축

### 9.1 엔티티 명확성 (Entity Clarity)

LLM이 "BigValue"와 "빅밸류"를 동일 엔티티로 인식하고, 외부 지식 그래프(Naver 블로그, LinkedIn 등)와 연결하도록 Organization 스키마를 보강한다.

| 속성 | 역할 |
|:---|:---|
| `name` | "BigValue" |
| `alternateName` | "빅밸류" (한글 표기) |
| `sameAs` | 외부 프로필 URL 배열 (Naver 블로그, LinkedIn, Instagram 등) |
| `@id` | 엔티티 식별자 (페이지 간 참조 연결) |
| `logo` ImageObject | 시각 엔티티 신호 |

### 9.2 인용 가능성 (Citation-Readiness)

문맥 없이 해당 문장만 추출해도 의미가 전달되는 독립 문장을 작성한다.

**나쁜 예** (컨텍스트 의존):
> "이 지역은 다른 지역보다 높다."

**좋은 예** (독립 인용 가능):
> "역삼동 카페 월 평균 매출은 1,240만원으로, 강남구 평균(1,050만원)보다 18% 높다 (2026년 2월 기준, 실제 카드 매출 데이터)."

FAQ 자동 생성은 이 축의 대표 구현. Q와 A가 각각 독립 완결 문장이다.

### 9.3 사실 밀도 (Factual Density)

구체 수치·날짜·측정 기준을 페이지 초반에 배치한다. JSON-LD에도 `variableMeasured`, `measurementTechnique("실제 카드 매출 데이터 집계")`, `dateModified` 를 명시하여 AI가 BigValue를 "원본 데이터 소스"로 인식하게 한다.

### 9.4 GEO에 유리한 콘텐츠 패턴

**정의형**:
```
[엔티티]는 [명확한 정의]. [장소]에 위치하며 [핵심 기능].
[날짜] 기준, [구체 수치]. [권위 출처]에 따르면 [뒷받침].
```

**통계 블록**:
```
- 카페 수: 87개
- 월평균 매출: 1,240만원
- 평균 영업기간: 3.2년
- 데이터 기준: 2026년 2월, 실제 카드 매출
```

**비교 테이블**: 인근 지역·가격·기간별 추이 (LLM이 표 데이터를 깔끔히 추출).

### 9.5 추가 JSON-LD 속성

- `speakable` — 음성 어시스턴트용 핵심 콘텐츠 마크업 (신규 GEO 신호)
- `dateModified` — AI는 최신 데이터를 우선 인용
- `@id` — 페이지 간 엔티티 참조 연결

---

## 10. E-E-A-T 근거 (BigValue)

Google의 콘텐츠 품질 평가 기준(Experience, Expertise, Authoritativeness, Trustworthiness).

| 기준 | BigValue 근거 |
|:---|:---|
| Experience (경험) | 실제 카드 매출 데이터 기반 (체험 데이터) |
| Expertise (전문성) | 53종 데이터 테이블의 전문적 조합 |
| Authoritativeness (권위성) | 데이터 출처 명시 (신한카드, 사업자등록 등) |
| Trustworthiness (신뢰성) | 업데이트 날짜·방법론 투명성, 표본 크기 안내 |

---

## 11. 모니터링 지표 체계

### 11.1 8대 지표와 임계치

| 지표 | 도구 | 정상 범위 | 알람 조건 |
|:---|:---|:---|:---|
| 색인율 (색인 수 / 제출 수) | GSC Coverage | 70%+ | 60% 미만 |
| 일 크롤 수 | GSC Crawl Stats | 지속 증가 | 급감 지속 |
| Naver Yeti 일 방문 | Naver Search Advisor | 50~500회 | 0회 지속 |
| sitemap 응답 시간 | CloudWatch | < 3초 (sitemap-biz는 < 30초, WAF idle 미만) | 임계 초과 |
| 평균 크롤 응답시간 | GSC 크롤 통계 | WAF 이전 대비 변동폭 ±20% 이내 | 20% 초과 |
| WAF 검색 봇 Block 건수 | CloudWatch Alarm | Googlebot/Yeti/Bingbot Block = **0** | ≥ 1 |
| GA4 Realtime 트래픽 | GA4 Realtime | WAF 이전 대비 동등 수준 | 급감 |
| 구조화 데이터 오류 | GSC 리치 결과 | 0건 | 신규 오류 |

### 11.2 "발견됨 - 미색인" 추이

GSC Coverage의 "Discovered - currently not indexed" 건수는 **감소 추세**여야 한다. 급증 시:
- Thin Content 비중 높음 (Helpful Content Classifier 작동 의심)
- 크롤 버짓 부족 (서버 응답 느림, WAF 차단)
- 사이트맵 lastmod 신뢰 상실

### 11.3 운영 주기

- **실시간**: WAF Logs 알람 (검색 봇 Block ≥ 1)
- **주 1회**: Athena Saved Query 리포트 (UA × action × terminatingRule)
- **월 1회**: 색인율 계산, Quality Gate 재평가, 구조화 데이터 에러 확인

---

## 12. 크롤 버짓 보호 — 종합 원칙

### 12.1 크롤 버짓이란

Google이 하루에 `bigvalue.ai`에 할당하는 크롤 요청 수. 이 예산을 **양질 페이지**에 쓰도록 설계하는 것이 pSEO 성공의 관건.

### 12.2 버짓을 낭비하는 패턴

| 낭비 요인 | 예방 |
|:---|:---|
| Thin Content | 양질의 데이터로 보강, 경고 배너로 투명성 (§8) |
| 파라미터 URL (`?utm=...`, `?sort=...`) | robots.txt `/*?*` 차단 |
| 느린 응답 | CDN 캐시, OOM 방지, 사이트맵 Array.push+join |
| 리다이렉트 체인 3단계+ | 직접 최종 URL 송출 |
| 사이트맵 lastmod 부정확 | 데이터 소스 매핑 |
| 404/5xx 증가 | WAF 오탐 제거, isDelisted 동기화 |
| 중복 콘텐츠 | canonical 단일화 |

### 12.3 WAF와의 관계

WAF는 크롤 버짓 보호의 **양날의 검**이다. 악성 봇 차단으로 버짓을 지켜주지만, 오탐으로 정상 검색 봇을 막으면 버짓 자체가 흐르지 않는다. WAF 허용 리스트는 robots.txt 허용 리스트와 **1:1 대응**되어야 한다. (구현 진단 절차는 `SEO-Implementation.md` §WAF 참조)

---

## 부록 — 용어집

| 용어 | 정의 |
|:---|:---|
| pSEO (Programmatic SEO) | 데이터로부터 대량의 SEO 페이지를 자동 생성하는 전략 |
| GEO (Generative Engine Optimization) | 생성형 AI 검색 최적화 |
| 크롤 버짓 (Crawl Budget) | 검색엔진이 사이트에 할당한 크롤 요청 수 |
| Thin Content | 사용자 가치가 낮은 얇은 콘텐츠 — Google Helpful Content Classifier 대상 |
| Flapping | 페이지가 색인 on/off 상태를 반복하는 현상 |
| IndexNow | Bing/Yandex가 주도하는 즉시 색인 제출 프로토콜 |
| canonical | 중복/유사 URL 중 대표 URL을 명시하는 링크 |
| lastmod | 사이트맵에서 URL의 실제 최종 수정일 |
| JSON-LD | 페이지에 삽입하는 구조화 데이터 표기 (schema.org) |
| E-E-A-T | Google의 콘텐츠 품질 평가 기준 |
