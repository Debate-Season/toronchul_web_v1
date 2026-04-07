# 애플 로그인 개발 계획

## 개요

카카오 로그인과 동일한 OIDC 패턴으로 구현:
```
[Apple로 시작하기 버튼] → Apple 인증 페이지로 redirect
    → 사용자 인증 완료
    → /oauth/callback/apple?code=xxx&id_token=xxx 로 돌아옴
    → 백엔드 /api/v2/users/login 호출 (socialType: "apple", idToken)
    → Zustand store에 토큰 저장 → 홈으로 이동
```

> 카카오와 다른 점: Apple은 콜백에서 `id_token`을 바로 전달해주므로, 별도 토큰 교환 API 호출이 필요 없음

---

## 1단계: Apple Developer 설정

### 1-1. Apple Developer 계정 접속

1. https://developer.apple.com 접속
2. 우측 상단 **Account** 클릭 → 로그인
3. 좌측 메뉴에서 **Certificates, Identifiers & Profiles** 클릭

### 1-2. App ID 확인 (이미 있을 수 있음)

1. 좌측 **Identifiers** 클릭
2. 우측 상단 필터를 **App IDs**로 설정
3. 토론철 앱의 App ID 찾기 (예: `com.rosyocean.debateseason`)
4. 클릭해서 들어간 후 **Capabilities** 목록에서 **Sign In with Apple** 체크 확인
   - 체크 안 되어 있으면 체크 → **Save**

### 1-3. Services ID 생성 (웹 로그인 전용, 핵심)

1. 좌측 **Identifiers** 클릭
2. 우측 상단 필터를 **Services IDs**로 변경
3. 우측 상단 **+** 버튼 클릭
4. **Services IDs** 선택 → **Continue**
5. 입력:
   - **Description**: `토론철 웹 로그인`
   - **Identifier**: `com.rosyocean.debateseason.web`
6. **Continue** → **Register**
7. 생성된 Services ID 목록에서 방금 만든 항목 클릭
8. **Sign In with Apple** 체크 → 우측 **Configure** 클릭
9. Configure 화면에서:
   - **Primary App ID**: 드롭다운에서 토론철 앱 선택 (`com.rosyocean.debateseason`)
   - **Domains and Subdomains**:
     ```
     toronchul.app
     localhost
     ```
   - **Return URLs**:
     ```
     https://toronchul.app/api/auth/apple/callback
     http://localhost:3000/api/auth/apple/callback
     ```
   - **Save** 클릭
10. 상단 **Continue** → **Save**

> **중요**: Identifier 값(`com.rosyocean.debateseason.web`)이 프론트의 `client_id`가 됨

### 1-4. Key 생성 (백엔드 id_token 검증용)

1. 좌측 **Keys** 클릭
2. 우측 상단 **+** 버튼 클릭
3. 입력:
   - **Key Name**: `토론철 Sign In with Apple`
4. **Sign In with Apple** 체크 → 우측 **Configure** 클릭
5. **Primary App ID**: 드롭다운에서 토론철 앱 선택 → **Save**
6. **Continue** → **Register**
7. **Download** 버튼 클릭 → `.p8` 파일 저장
   - **이 파일은 한 번만 다운로드 가능**, 안전한 곳에 보관
8. 화면에 표시된 **Key ID** 메모 (예: `ABC123DEF4`)

> `.p8` 파일과 Key ID는 백엔드 개발자에게 전달

### 1-5. Team ID 확인

1. https://developer.apple.com/account → 우측 상단 **Membership details**
2. **Team ID** 메모 (예: `XYZ789`)

---

## 2단계: 백엔드 확인/요청

백엔드 담당자에게 아래 정보 전달 및 확인:

### 전달할 정보
| 항목 | 값 |
|------|-----|
| Services ID (client_id) | `com.rosyocean.debateseason.web` |
| Key ID | 1-4에서 메모한 값 |
| Team ID | 1-5에서 메모한 값 |
| `.p8` Key 파일 | 1-4에서 다운로드한 파일 |

### 확인할 것
- [ ] `/api/v2/users/login`에서 `socialType: "apple"` + `idToken` 처리 가능한지
- [ ] Apple의 id_token 검증 로직 구현 여부 (Apple 공개키로 JWT 검증)
- [ ] 웹과 앱의 client_id가 다르므로 (`com.rosyocean.debateseason.web` vs `com.rosyocean.debateseason`), 백엔드에서 둘 다 허용하는지

---

## 3단계: 환경 변수 설정

### 로컬 (.env.local)
```env
# ── Apple OAuth ───────────────────────────────────
NEXT_PUBLIC_APPLE_CLIENT_ID=com.rosyocean.debateseason.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=http://localhost:3000/api/auth/apple/callback
```

### 운영 (배포 플랫폼)
```env
NEXT_PUBLIC_APPLE_CLIENT_ID=com.rosyocean.debateseason.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://toronchul.app/api/auth/apple/callback
```

---

## 4단계: 웹 프론트엔드 구현

백엔드 준비 완료 후 진행.

### 4-1. 로그인 모달 Apple 버튼 활성화
- `src/components/layout/RedditLayout.tsx`의 `DeButtonLarge` (현재 `enable={false}`) 활성화
- 클릭 시 Apple 인증 URL로 redirect:
  ```
  https://appleid.apple.com/auth/authorize
    ?client_id=com.rosyocean.debateseason.web
    &redirect_uri=http://localhost:3000/oauth/callback/apple
    &response_type=code id_token
    &response_mode=form_post
    &scope=name email
  ```

### 4-2. 콜백 Route Handler + 페이지 생성
- `src/app/oauth/callback/apple/route.ts` — Apple `form_post` POST 수신 → query param GET 리다이렉트
- `src/app/oauth/callback/apple/page.tsx` — `useSearchParams()`에서 `id_token` 추출
- `loginWithOidc({ socialType: "apple", idToken })` 호출
- 성공 시 홈으로 이동

### 4-3. 로그인 페이지도 동일 적용
- `src/app/login/page.tsx`의 Apple 버튼도 활성화

---

## 카카오 vs 애플 비교

| 항목 | 카카오 | 애플 |
|------|--------|------|
| 인증 URL | `kauth.kakao.com/oauth/authorize` | `appleid.apple.com/auth/authorize` |
| 콜백에서 받는 것 | `code` (→ 토큰 교환 필요) | `code` + `id_token` (바로 사용) |
| client_id | REST API 키 | Services ID |
| OpenID Connect | 콘솔에서 별도 활성화 | 기본 지원 |
| 토큰 교환 | 프론트에서 카카오 API 호출 | 불필요 (id_token 직접 전달) |

---

## 체크리스트

### Apple Developer 설정
- [ ] App ID에 Sign In with Apple 활성화
- [ ] Services ID 생성 + 도메인/Return URL 등록
- [ ] Key 생성 + .p8 파일 다운로드
- [ ] Team ID 확인

### 백엔드
- [ ] Apple id_token 검증 로직 구현
- [ ] 웹 Services ID를 허용 client_id로 등록

### 프론트엔드 ✅ (2026-04-08 코드 완료)
- [ ] 환경 변수 추가 (.env.local + 운영) — Apple Developer 설정 후
- [x] `src/lib/auth/apple.ts` — `redirectToApple()`, `verifyAppleOAuthState()`
- [x] `src/app/api/auth/apple/callback/route.ts` — form_post POST → GET 리다이렉트
- [x] `src/app/oauth/callback/apple/page.tsx` — 클라이언트 콜백 페이지
- [x] 로그인 모달/페이지 Apple 버튼 활성화

### 테스트
- [ ] 로컬에서 Apple 로그인 → 홈 이동 확인
- [ ] 운영에서 Apple 로그인 → 홈 이동 확인
- [ ] Safari / Chrome 모두 동작 확인
