# PostHog 도입 조사 — v0.8.0 후보

> 상태: **조사(ideation)**. 결정된 것 없음. 기능 전수 조사 + 우리 스택에 붙일 때의 제약을 정리한다.
> 조사일: 2026-08-19 / 조사 대상: [posthog/posthog](https://github.com/posthog/posthog), [posthog.com/docs](https://posthog.com/docs)

---

## 0. 세 줄 요약

1. PostHog 은 단일 제품이 아니라 **제품 분석 + 세션 리플레이 + 피처 플래그 + A/B 테스트 + 설문 + 에러 트래킹 + CDP** 를 하나의 이벤트 스트림 위에 올린 묶음이다. GA4 · Sentry · LaunchDarkly · Hotjar · Typeform 을 각각 붙이는 대신 하나로 덮는 구조가 핵심 가치다.
2. **토론철 웹에는 지금 계측이 0건이다.** `package.json` · `src/` 전체에 gtag · GA · Sentry · Amplitude · Mixpanel 어느 것도 없다. 즉 "무엇을 갈아끼울까"가 아니라 "처음 무엇을 심을까"의 문제다.
3. 무료 티어가 넉넉해서(월 100만 이벤트 · 리플레이 5천 세션) 비용은 초기 장벽이 아니다. **진짜 장벽은 두 개** — ① APAC 리전이 없어 데이터가 미국/EU 로 나간다(국외이전 고지 의무) ② 토론방 세션 리플레이는 **찬반 = 정치적 견해**를 화면째 녹화하게 된다.

---

## 1. 왜 지금인가 — 계측 공백

현재 우리가 답할 수 없는 질문들:

| 질문 | 지금 알 수 있나 |
|---|---|
| 홈에 들어온 사람 중 몇 %가 토론방까지 가나 | ❌ |
| 토론방에서 실제로 메시지를 쓰는 비율 | ❌ (백엔드 메시지 수로 역산만 가능) |
| 어제 바꾼 햄버거 메뉴를 사람들이 여는가 | ❌ |
| 찬반 투표까지 갔다가 이탈하는 지점 | ❌ |
| 로그인 퍼널(카카오/애플) 어디서 깨지나 | ❌ — 실패해도 우리는 모른다 |
| 프론트에서 터진 에러 | ❌ — Sentry 도 없다 |

v0.7.1 에서 IA 를 2단계로 줄이고 §6 에서 화면을 크게 바꿨는데, **개선 여부를 측정할 수단이 없다.** 이게 v0.8.0 후보로 올라온 이유로 보인다.

---

## 2. PostHog 제품 전수

공식 문서 기준 제품군. "우리 관련도"는 토론철 웹 기준 주관적 판단이다.

| 제품 | 한 줄 | 우리 관련도 |
|---|---|---|
| **Product Analytics** | 이벤트 기반 퍼널·리텐션·경로·코호트 분석 | ★★★ |
| **Web Analytics** | GA3 스타일 대시보드(방문자·세션·이탈률·유입경로) | ★★★ |
| **Session Replay** | 사용자 화면을 DVR 처럼 재생 + 콘솔·네트워크 동기화 | ★★☆ (리스크 있음, §6) |
| **Error Tracking** | 예외 수집 → 이슈로 묶고 담당자 배정. 소스맵 업로드 | ★★★ |
| **Feature Flags** | 배포 없이 기능 on/off, 퍼센트 롤아웃, 킬 스위치 | ★★★ |
| **Experiments** | A/B·다변량 테스트. 베이지안/빈도주의 양쪽 | ★☆☆ (트래픽 필요) |
| **Surveys** | NPS·PMF·이탈사유 설문. 노코드 + 타겟팅 | ★★☆ |
| **Data Pipelines (CDP)** | 소스 수집 · 인제스트 시점 변환 · 실시간/배치 목적지 전송 | ★☆☆ |
| **Managed Warehouse** | 외부 데이터를 끌어와 이벤트와 조인 | ☆☆☆ |
| **AI Observability** | LLM 호출 추적(토큰·비용·지연) | ☆☆☆ (지금 LLM 미사용) |
| **Logs** | 로그 수집 | ☆☆☆ |
| **PostHog AI / Self-driving** | 이슈를 군집화하고 PR 까지 열어주는 에이전트 | ☆☆☆ (평가 유보) |

### 2.1 Product Analytics

- 인사이트 타입: **trends · funnels · retention · paths · stickiness · lifecycle** + 상관분석 + SQL 직접 질의.
- 수집 방식 두 가지: **오토캡처**(페이지뷰·클릭·폼 제출을 코드 없이) vs **커스텀 이벤트**(직접 계측).
- `identify()` 로 익명 활동과 로그인 후 활동을 한 사람으로 잇는다 → 퍼널·리텐션이 실제 사람 수로 집계된다.
- person/group properties 로 세그먼트, 대시보드 공유, 지표 알림.
- 인사이트에서 **그 뒤의 세션 리플레이 / 그 기능을 막고 있던 플래그 / 그걸 바꾼 실험**으로 바로 이동 가능 — 제품군을 하나로 묶은 이유가 여기다.

### 2.2 Web Analytics

Product Analytics 와 **같은 이벤트 위에서 돌지만 화면이 다르다.** 방문자·페이지뷰·세션·이탈률·인기 페이지·유입 채널(리퍼러+UTM 자동 분류)을 별도 계측 없이 보여준다. 봇/AI 트래픽은 질의 시점에 자동 분류.

> 실무적 의미: **`posthog.init()` 한 줄만 넣어도 GA4 수준 대시보드가 즉시 생긴다.** 커스텀 이벤트 설계는 그다음 단계로 미룰 수 있다.

### 2.3 Session Replay

- 녹화 대상: DOM 변화 + 콘솔 로그 + 네트워크 워터폴. canvas · iframe 도 지원.
- 플랫폼: 웹 · iOS · Android · **Flutter** · React Native.
- 프라이버시: **기기를 떠나기 전에** 텍스트·입력·특정 엘리먼트를 마스킹. `ph-no-capture` 류의 클래스로 지정.
- 비용/부하 관리: 샘플링, URL 조건, 피처 플래그로 "가치 있는 세션만" 녹화. 보존 기간 설정.
- 에러 트래킹·설문 응답에 해당 세션 리플레이가 자동으로 붙는다.

### 2.4 Error Tracking

- 웹/백엔드/모바일 SDK 에서 예외를 자동 수집 → 핑거프린팅으로 **이슈** 단위로 묶음.
- **소스맵/심볼 업로드** 지원 → 난독화된 스택트레이스가 원본 코드를 가리킴.
- 이슈마다 그 사용자의 리플레이·이벤트·속성이 붙어서 **재현 없이** 원인을 본다.
- 담당자 배정 / 해결 처리.

> Sentry 를 따로 붙일지 여기로 합칠지가 §7 결정 항목.

### 2.5 Feature Flags

- boolean / 멀티배리언트, 퍼센트 롤아웃, person·group·cohort 속성 타겟팅, 카나리.
- **로컬 평가** — 서버에서 플래그를 해석해 왕복 제거.
- **부트스트랩** — SSR 에서 플래그 값을 미리 심어 깜빡임(flicker) 제거. Next.js 에서 특히 중요.
- **remote config** — 플래그에 JSON 페이로드를 실어 배포 없이 설정 변경.
- 얼리 액세스 프로그램(사용자가 스스로 베타 옵트인), 킬 스위치.
- 같은 플래그가 그대로 실험(A/B)의 배분 장치가 된다.

### 2.6 Experiments

- 지표는 **기존 이벤트를 그대로 쓴다** — 실험용 추가 계측 불필요.
- funnel / mean / ratio 지표, 베이지안·빈도주의 선택, **CUPED 분산 감소**, 표본 크기·기간 계산기, 홀드아웃, 실험 중 배분 조정.
- 플래그 없이도 실험 구성 가능.

### 2.7 Surveys

- NPS · PMF · 이탈사유 · 자유서술. 이전 답변에 따른 **조건부 분기**.
- 타겟팅이 이벤트·속성·코호트·**피처 플래그**와 같은 체계 → "토론방에 3회 이상 들어온 사람에게만" 같은 조건이 바로 된다.
- 응답이 일반 이벤트로 저장되어 차트·SQL·Slack 웹훅으로 흐른다. 응답마다 리플레이가 붙는다.

### 2.8 Data Pipelines (CDP)

- **Sources**: 수백 개 툴에서 동기화하거나 인커밍 웹훅으로 밀어넣기.
- **Transformations**: 저장 **전에** 이벤트 속성을 추가/수정/삭제 (예: `user_tier` 라벨링).
- **Destinations**: 실시간 웹훅(Slack · HubSpot · Intercom …) 또는 배치 내보내기(S3 · BigQuery).

---

## 3. 요금

무료 플랜: **1 프로젝트 · 1년 보존 · 팀원 무제한 · 신용카드 불필요.**

| 제품 | 월 무료 | 초과 단가(최저 구간) |
|---|---|---|
| Product Analytics | 100만 이벤트 | $0.00005 / 이벤트 |
| Session Replay | 5,000 세션 (+모바일 2,500) | $0.005 / 세션 |
| Feature Flags | 100만 요청 | $0.0001 / 요청 |
| Error Tracking | 10만 예외 | $0.00037 / 예외 |
| Surveys | 1,500 응답 | $0.10 / 응답 |
| Data Warehouse | 100만 행 | $0.000015 / 행 |
| AI Observability | 10만 이벤트 | — |

> **주의 — 이벤트 수 폭발 지점.** 오토캡처를 켜면 클릭 하나하나가 이벤트다. 토론방은 스크롤·탭 전환·메시지 수신이 잦아 **채팅 화면에서만 오토캡처가 이벤트를 빠르게 태울 수 있다.** 실제 MAU 를 아직 모르므로 숫자를 못 박지 않는다. 계산식만 남긴다:
> `월 이벤트 ≈ MAU × 세션/월 × 세션당 이벤트`. 세션당 오토캡처 이벤트는 경험적으로 30~100.
> MAU 3,000 · 세션 4회 · 이벤트 50 이면 60만 → 무료 안. MAU 10,000 이면 200만 → 유료 구간.

비용 조절 레버: 오토캡처 끄기(수동 계측만), `person_profiles: 'identified_only'`, 리플레이 샘플링.

---

## 4. 우리 스택에 붙일 때

### 4.1 Next.js 16 App Router 특이사항

| 항목 | 내용 |
|---|---|
| 패키지 | `posthog-js`(브라우저), `posthog-node`(서버) |
| 초기화 | 클라이언트 컴포넌트 프로바이더로 감싼다. Next 최신 버전은 `instrumentation-client.ts` 경로도 제공 |
| **페이지뷰 수동 처리** | App Router 는 클라이언트 라우팅이라 자동 페이지뷰가 **중복되거나 누락된다.** 오토캡처의 `$pageview` 를 끄고 `usePathname` + `useSearchParams` 로 직접 캡처하는 것이 공식 권장 |
| CSP | `script-src` / `connect-src` 에 PostHog 도메인 허용 필요. **빠뜨리면 조용히 실패한다**(capture·identify 가 아무 에러 없이 안 나감) |
| 리버스 프록시 | `next.config.ts` rewrite 로 우리 도메인을 통해 전송 → 차단기·ITP 회피, 전달률 개선 |

> **우리는 이미 rewrite 패턴을 쓰고 있다.** `next.config.ts` 에 `/proxy/api/:path*` · `/prod/:path*` · `/images/:path*` 3개가 있다. PostHog 프록시도 같은 자리에 `/ph/:path*` 한 줄로 들어간다 — 새로운 구조를 만들 필요가 없다.

### 4.2 CLAUDE.md 불문율과 부딪히는 지점

미리 정해두지 않으면 도입 도중 반드시 걸린다.

| 불문율 | 충돌 | 제안 |
|---|---|---|
| **#2 `fetch` 직접호출 금지, `apiFetch` 경유** | PostHog SDK 는 자체 전송 계층으로 직접 네트워크를 친다 | `apiFetch` 는 **우리 백엔드 envelope 전용** 규칙임을 명문화. 서드파티 SDK 는 예외로 적고, 대신 "PostHog 호출을 컴포넌트에 흩지 말고 `src/lib/analytics/` 한 곳에 래핑" 규칙을 새로 둔다 |
| **#3 `any` 금지** | `posthog.capture(event, properties)` 의 properties 가 느슨함 | 이벤트 이름·속성을 **유니온 타입으로 좁힌 자체 래퍼**를 만든다. 오타난 이벤트 이름이 컴파일에서 걸리는 게 계측 품질의 핵심 |
| **#4 persist 스토어 `_hasHydrated` 가드** | `identify()` 를 하이드레이션 전에 부르면 로그인 상태를 못 읽어 **익명으로 잘못 식별**된다 | `useAuthStore._hasHydrated` 를 기다린 뒤 `identify()`. 기존 패턴 그대로 |
| **#5 TDS 는 leaf** | `De*` 컴포넌트에 트래킹을 심고 싶어짐 | 금지. 버튼은 `onClick` 을 props 로 받고, 캡처는 호출부(기능 컴포넌트)에서 |
| **#7 기능 간 교차 import 금지** | 어디서나 부르는 성격 | `src/lib/analytics/` 는 `lib` 이라 기능 디렉토리가 아니다. 문제없음 |

### 4.3 식별(identify) 설계

- PostHog 은 **익명 이벤트**(프로필 없음)와 **식별 이벤트**(프로필 생성)를 구분한다. `person_profiles: 'identified_only'` 로 두면 익명 트래픽이 프로필을 만들지 않아 비용이 준다.
- 우리는 카카오·애플 로그인이 있으므로 **로그인 성공 시점에 `identify(백엔드 userId)`**, 로그아웃 시 `reset()`.
- ⚠️ **모바일 앱과 같은 사람으로 묶으려면 웹과 앱이 같은 distinct ID(백엔드 userId)를 써야 한다.** 앱에도 PostHog(Flutter SDK)를 넣을지, 넣는다면 어느 릴리스인지가 §7 결정 항목. 지금 앱 작업은 Flutter 3.27→3.44 업그레이드와 합본이라 일정 미정이다(v0.7.1 §12-5).

---

## 5. 토론철에 실제로 쓸모 있는 것 — 우선순위 초안

### 1순위 — 넣자마자 값이 나오는 것

1. **Web Analytics + 기본 페이지뷰.** `init` 한 줄로 방문자·유입·인기 이슈가 보인다. 지금 0인 정보라 체감이 가장 크다.
2. **Error Tracking.** 프론트 에러를 아무도 모르는 상태가 끝난다. 실제로 v0.7.1 기간에 `/api/v1/users/home` 500, null sender 메시지 같은 사고가 있었고(`docs/incident_2026-07-18_*.md`), 다음에는 사용자가 말해주기 전에 알 수 있다.
3. **핵심 퍼널 커스텀 이벤트 5~10개.** 오토캡처에 기대지 말고 직접 정의:
   `issue_viewed` → `thread_opened` → `vote_cast` → `message_sent`, 그리고 `login_started` → `login_succeeded` / `login_failed(provider, reason)`.

### 2순위 — 구조가 갖춰진 뒤

4. **Feature Flags.** "전체" 탭처럼 앱 배포를 기다리는 기능(v0.7.1 §12-5)을 **플래그 뒤에 먼저 머지**해 둘 수 있다. 지금은 앱 일정 때문에 코드를 못 넣고 있는데, 플래그가 있으면 코드는 들어가고 노출만 잠근다.
5. **Surveys.** 토론방 개편(§6)에 대한 정성 피드백. "찬반 패널이 사이드바로 간 게 나은가"는 숫자로 안 나온다.

### 3순위 — 유보

6. **Session Replay** — §6 리스크 해소 후.
7. **Experiments** — 트래픽이 통계적으로 유의한 규모가 된 뒤. 지금 A/B 는 노이즈만 본다.
8. **Warehouse / CDP / LLM Observability** — 현재 용도 없음.

---

## 6. 리스크

### 6.1 🔴 세션 리플레이 = 정치적 견해 녹화

토론방 화면에는 **그 사람의 찬반 입장**(투표 버튼 선택 상태, 말풍선 정렬·색)과 **작성 중인 메시지 본문**이 있다. 이걸 그대로 녹화하면:

- 개인정보보호법상 **사상·신념, 정치적 견해는 민감정보**(제23조)로 원칙적 처리 금지 · 별도 동의 필요.
- 리플레이는 "화면 그대로"라 익명 통계와 성격이 다르다.

→ 리플레이를 켠다면 **토론방 URL 은 녹화 제외**하거나, 채팅 영역·투표 버튼을 전부 마스킹해야 한다. PostHog 은 URL 조건과 엘리먼트 마스킹을 둘 다 지원하므로 기술적으로는 가능하다. **법적 판단은 이 문서 범위 밖 — 확인 필요.**

### 6.2 🟠 데이터 국외 이전

- PostHog Cloud 리전은 **US · EU 둘뿐. APAC 없다.**
- 한국 서비스가 한국 이용자 데이터를 미국/EU 로 보내면 **개인정보 국외이전 고지·동의**(제28조의8) 대상.
- 부수 효과: 서울↔프랑크푸르트/미국 왕복 지연. 수집은 비동기라 UX 영향은 작지만, 피처 플래그를 **원격 평가**하면 초기 렌더가 그만큼 늦는다 → 로컬 평가/부트스트랩이 사실상 필수.
- 대안: **셀프호스팅.** MIT 라이선스(`ee` 디렉토리 제외), Docker Compose 배포. 다만 공식 문서가 **"단일 머신 기준이라 수십만 이벤트를 넘기면 상당한 노력 없이는 확장되지 않는다"**고 명시하고 소규모 팀이라 지원이 제한적이라고 밝힌다. Kubernetes 신규 배포는 지원 종료. → **운영 인력이 1인인 지금 권장하지 않는다.**

### 6.3 🟡 이벤트 수 폭발

오토캡처를 그대로 켜면 채팅 화면에서 이벤트가 빠르게 쌓인다. **오토캡처를 끄고 수동 계측으로 시작**하는 편이 비용·데이터 품질 양쪽에 낫다. 어차피 우리가 알고 싶은 건 정해진 퍼널이다.

### 6.4 🟡 광고 차단기

`posthog.com` 도메인 직접 호출은 차단기에 막힌다. 리버스 프록시(§4.1)로 우회 — 이미 rewrite 패턴이 있어 비용이 거의 없다.

---

## 7. 결정 필요

| # | 항목 | 선택지 |
|---|---|---|
| 1 | 호스팅 | **PostHog Cloud US** / Cloud EU / 셀프호스팅 |
| 2 | 국외이전 고지 | 개인정보처리방침 개정 필요 여부 — **법무 확인** |
| 3 | 세션 리플레이 | 도입 안 함 / 토론방 제외하고 도입 / 전면 마스킹 후 도입 |
| 4 | 오토캡처 | 끄고 수동 계측 / 켜고 시작 |
| 5 | 에러 트래킹 | PostHog 로 통합 / Sentry 별도 |
| 6 | 앱 포함 여부 | 웹만 / Flutter SDK 도 (앱 릴리스 일정에 종속 — v0.7.1 §12-5) |
| 7 | 백엔드 포함 여부 | 프론트만 / `posthog-node` 로 서버 이벤트도 |

---

## 8. 다음 단계 제안

1. §7 의 1·3·4 를 먼저 정한다 — 나머지는 여기에 딸려온다.
2. **무료 계정으로 스파이크**: `init` + 페이지뷰 + 에러 트래킹만 로컬에 붙여 하루 돌려보고 이벤트 볼륨 실측. 추정 대신 숫자를 얻는다.
3. 실측 후 **이벤트 명세(taxonomy)를 문서로 먼저 확정**하고, 그다음 `src/lib/analytics/` 타입 래퍼를 만든다. 이벤트 이름은 한 번 흩뿌리면 되돌리기 어렵다.
4. v0.8.0 PRD 작성 — 이 문서는 조사 단계이므로 그대로 PRD 가 되지 않는다.

---

## 9. 출처

- [PostHog Docs](https://posthog.com/docs) · [Product Analytics](https://posthog.com/docs/product-analytics) · [Web Analytics](https://posthog.com/docs/web-analytics)
- [Session Replay](https://posthog.com/docs/session-replay) · [Error Tracking](https://posthog.com/docs/error-tracking)
- [Feature Flags](https://posthog.com/docs/feature-flags) · [Experiments](https://posthog.com/docs/experiments) · [Surveys](https://posthog.com/docs/surveys)
- [Data Pipelines (CDP)](https://posthog.com/docs/cdp) · [Person profiles](https://posthog.com/docs/data/persons)
- [Next.js 연동](https://posthog.com/docs/libraries/next-js) · [Privacy](https://posthog.com/docs/privacy) · [Pricing](https://posthog.com/pricing)
- [Self-host 안내](https://posthog.com/docs/self-host) 및 [면책 고지](https://posthog.com/docs/self-host/open-source/disclaimer)
- [GitHub: posthog/posthog](https://github.com/posthog/posthog)

> 조사는 공식 문서 기준이다. **연동 코드 조각은 이 문서에 옮기지 않았다** — 문서 요약 과정에서 실제와 다른 코드가 섞일 수 있어, 구현 시점에 위 Next.js 연동 문서를 직접 열어 확인할 것. (불문율 #1 의 정신 — 추측으로 스펙을 만들지 않는다.)
