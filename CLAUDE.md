# toronchul_web_v1 — Claude Code 가이드

Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind v4 + Zustand. 토론철 웹 프론트엔드.

## 스택 핵심

- **라우팅**: App Router (`src/app/`). 동적 세그먼트 `[id]`, `[slug]`.
- **상태**: Zustand. persist 스토어는 `_hasHydrated` 패턴 필수 (`src/store/useAuthStore.ts`).
- **네트워크**: 모든 API 호출은 `apiFetch` (`src/lib/api/client.ts`) 경유. 브라우저에서는 `/proxy` rewrite, SSR은 `API_BASE_URL` 직접 호출. envelope `{status, code, message, data}` 은 `apiFetch` 가 자동 unwrap.
- **백엔드**: `https://toronchul.app/prod` (Swagger: `/v3/api-docs`).
- **스타일**: Tailwind 토큰만. hex/rgb 금지. 토큰은 `src/app/globals.css` 정의. 공용 컴포넌트는 `De*` 접두사 (`src/components/TDS/`).

## 자주 쓰는 명령

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 전문 에이전트 (`.claude/agents/`)

다음 작업에는 메인 Claude 가 아니라 전용 에이전트를 우선 호출할 것:

| 작업 | 에이전트 |
|---|---|
| 새 API 모듈 (`src/lib/api/<feature>.ts`) 작성 | `nextjs-api-client-builder` |
| Swagger ↔ 프론트 DTO 동기화/드리프트 감지 | `nextjs-swagger-sync` |
| 새 App Router 페이지 스캐폴드 | `nextjs-route-page-scaffolder` |
| 동적 라우트 SEO 메타데이터 생성 | `nextjs-seo-metadata` |
| `De*` 디자인시스템 컴포넌트 작성 | `nextjs-tds-component-builder` |
| 새 Zustand 스토어 작성 | `nextjs-zustand-store-scaffolder` |
| 변경사항 컨벤션 감사 (읽기 전용) | `nextjs-architecture-auditor` |

비트리비얼한 변경 후에는 `nextjs-architecture-auditor` 를 proactive 로 돌릴 것.

## 불문율 (에이전트/메인 공통)

1. **필드 조작 금지** — Swagger 또는 실제 `curl` 응답 없이 API 타입을 만들지 말 것. 과거 `/api/v1/users/home` 500 이슈가 백엔드 실제 스펙과 프론트 추측의 불일치에서 발생.
2. **fetch 직접호출 금지** — 컴포넌트/훅에서 `fetch(` 금지. 반드시 `apiFetch` 경유.
3. **any 금지** — `unknown` + narrowing 사용. `@ts-ignore`, `!` non-null assertion 금지.
4. **persist 스토어의 `_hasHydrated` 가드** — 컨슈머는 `if (!_hasHydrated) return;` 로 첫 렌더 스킵 (예: `src/app/page.tsx:295`).
5. **TDS 는 leaf** — `src/components/TDS/*` 는 `@/lib/api/*`, `@/store/*` 를 import 하면 안 됨. 데이터는 props 로만 주입.
6. **hex/rgb 금지** — Tailwind 디자인 토큰만. 필요한 토큰이 없으면 `globals.css` 에 추가 후 사용.
7. **기능 간 컴포넌트 교차 import 금지** — `src/components/home/*` 가 `src/components/map/*` 를 import 하면 TDS 로 승격시키거나 공용 위치로 이동.
8. **커밋 전 lint** — `git commit` 은 `PreToolUse` 훅이 `npm run lint` 를 자동 실행. 실패 시 커밋 차단.

## 디렉토리 지도

```
src/
├── app/                 # App Router (page/layout/loading/error)
├── components/
│   ├── TDS/            # 디자인시스템 (De* 접두사, leaf)
│   ├── home/, map/, layout/   # 기능별 컴포넌트
├── lib/
│   ├── api/            # apiFetch 기반 API 모듈 (feature 단위)
│   └── slug.ts         # slug 유틸
└── store/              # Zustand (persist + _hasHydrated)
```

## 참고 문서

- `docs/home-feed-api.md` — 홈 피드 API 연동 이력
- `docs/claude-md-reference.md` — **Flutter 리포 참고용** (이 리포 규칙 아님, 구조 스타일 참조만)
