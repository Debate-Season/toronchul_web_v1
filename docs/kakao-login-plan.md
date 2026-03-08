# 카카오 로그인 개발 계획

## 현재 구현 상태 (완료)

| 항목 | 상태 | 파일 |
|------|------|------|
| Zustand Auth Store | ✅ | `src/store/useAuthStore.ts` |
| Auth API (loginWithOidc) | ✅ | `src/lib/api/auth.ts` |
| 로그인 페이지 UI | ✅ | `src/app/login/page.tsx` |
| 로그인 모달 UI | ✅ | `src/components/layout/RedditLayout.tsx` |
| 카카오 콜백 페이지 | ✅ | `src/app/oauth/callback/kakao/page.tsx` |
| API 프록시 (CORS 우회) | ✅ | `next.config.ts` rewrites |

### 로그인 흐름
```
[로그인 버튼 (모달)] → 카카오 인가 페이지로 redirect
    → 카카오 인증 완료
    → /oauth/callback/kakao?code=xxx 로 돌아옴
    → 브라우저에서 카카오 토큰 API 호출 (code → id_token)
    → 백엔드 /api/v2/users/login 호출 (id_token → JWT)
    → Zustand store에 토큰 저장 → 홈으로 이동
```

---

## 남은 작업

### 1단계: .env.local 수정 (로컬 개발용)

현재 `.env.local`에 `NEXT_PUBLIC_KAKAO_CLIENT_ID` 값이 비어 있음.

```env
# ── REST API ──────────────────────────────────────
API_BASE_URL=https://toronchul.app/prod
NEXT_PUBLIC_API_URL=https://toronchul.app/prod

# ── WebSocket ─────────────────────────────────────
NEXT_PUBLIC_WS_URL=wss://toronchul.app/prod/ws-stomp

# ── Image CDN ─────────────────────────────────────
NEXT_PUBLIC_IMAGE_URL=https://toronchul.app/images/

# ── Kakao OAuth ───────────────────────────────────
NEXT_PUBLIC_KAKAO_CLIENT_ID=카카오_REST_API_키
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/oauth/callback/kakao

# ── Amplitude Analytics ───────────────────────────
NEXT_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_api_key
```

> `NEXT_PUBLIC_KAKAO_CLIENT_ID`는 카카오 개발자 콘솔 → 내 애플리케이션 → **REST API 키** 값을 넣어야 함 (JavaScript 키 아님)

### 2단계: 카카오 개발자 콘솔 설정

카카오 개발자 콘솔(https://developers.kakao.com) → 내 애플리케이션에서 확인/설정:

#### 로컬 개발 환경
- [ ] **플랫폼 → Web 사이트 도메인**: `http://localhost:3000` 추가
- [ ] **카카오 로그인 → 활성화**: ON
- [ ] **카카오 로그인 → OpenID Connect**: ON (id_token 발급에 필수)
- [ ] **카카오 로그인 → Redirect URI**: `http://localhost:3000/oauth/callback/kakao` 추가

#### 운영 배포 환경
- [ ] **플랫폼 → Web 사이트 도메인**: `https://toronchul.app` 추가 (실제 운영 도메인)
- [ ] **카카오 로그인 → Redirect URI**: `https://toronchul.app/oauth/callback/kakao` 추가

### 3단계: 운영 환경 변수 설정

배포 플랫폼(Vercel, AWS 등)에 아래 환경 변수 등록:

```env
API_BASE_URL=https://toronchul.app/prod
NEXT_PUBLIC_API_URL=https://toronchul.app/prod
NEXT_PUBLIC_WS_URL=wss://toronchul.app/prod/ws-stomp
NEXT_PUBLIC_IMAGE_URL=https://toronchul.app/images/
NEXT_PUBLIC_KAKAO_CLIENT_ID=카카오_REST_API_키 (로컬과 동일)
NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://toronchul.app/oauth/callback/kakao
NEXT_PUBLIC_AMPLITUDE_API_KEY=운영_amplitude_키
```

> **핵심 차이**: `NEXT_PUBLIC_KAKAO_REDIRECT_URI`가 로컬은 `http://localhost:3000/...`, 운영은 `https://toronchul.app/...`

### 4단계: 백엔드 CORS 확인

백엔드에서 웹 도메인의 요청을 허용하는지 확인:
- [ ] 로컬: `http://localhost:3000` 허용
- [ ] 운영: `https://toronchul.app` 허용

> 현재 웹에서 백엔드 호출은 Next.js rewrites(`/proxy → API_BASE_URL`)를 통해 프록시되므로 CORS 문제가 발생하지 않음. 단, 카카오 콜백 페이지에서 카카오 토큰 API(`kauth.kakao.com`)를 브라우저에서 직접 호출하는데, 카카오 측에서 CORS를 허용하고 있어 문제없음.

---

## 에러 발생 시 디버깅 가이드

| 에러 | 원인 | 해결 |
|------|------|------|
| 카카오 페이지에서 "잘못된 요청" | REST API 키가 틀림 | `.env.local`의 `NEXT_PUBLIC_KAKAO_CLIENT_ID` 확인 |
| 카카오 페이지에서 "등록되지 않은 redirect URI" | Redirect URI 불일치 | 카카오 콘솔의 Redirect URI와 `.env.local`의 값 정확히 일치하는지 확인 |
| `카카오 토큰 발급 실패: 400` | 인가 코드 만료 또는 Redirect URI 불일치 | 카카오 콘솔 설정 재확인. 코드는 1회용이라 새로고침 시 실패 |
| `id_token이 응답에 포함되어 있지 않습니다` | OpenID Connect 미활성화 | 카카오 콘솔 → 카카오 로그인 → OpenID Connect → ON |
| `[401] ...` 또는 `로그인에 실패했습니다` | 백엔드 OIDC 검증 실패 | 백엔드 로그 확인. 카카오 앱 키가 백엔드에 등록된 것과 일치하는지 확인 |
| 콜백 페이지 무한 로딩 | KAKAO_REDIRECT_URI가 비어있음 | `.env.local` 값 확인 후 dev 서버 재시작 |

---

## 테스트 체크리스트

### 로컬 테스트
1. `npm run dev` 실행
2. `http://localhost:3000` 접속
3. 우측 상단 로그인 버튼 클릭 → 모달에서 "카카오로 시작하기" 클릭
4. 카카오 인증 완료 후 홈으로 돌아오는지 확인
5. 브라우저 DevTools → Application → Local Storage → `auth-storage`에 토큰 저장 확인
6. 로그인 상태에서 우측 상단이 프로필 아이콘으로 바뀌는지 확인

### 운영 테스트
1. 배포 후 `https://toronchul.app` 접속
2. 동일한 로그인 플로우 테스트
3. HTTPS 환경에서 카카오 콜백이 정상 작동하는지 확인
