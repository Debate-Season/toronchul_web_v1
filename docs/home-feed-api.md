# 홈 피드 API 연동

## 개요

홈 화면의 더미 데이터를 백엔드 API(`GET /api/v1/home/recommend`)로 교체하고,
커서 기반 페이지네이션과 스켈레톤 로딩 UI를 구현했다.

## 변경 파일

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/lib/api/home.ts` | 신규 | 홈 피드 DTO 타입 + `fetchHomeRecommend()` |
| `src/lib/api/auth.ts` | 수정 | `apiFetch` 기반으로 import 변경 |
| `src/components/home/IssueCardNew.tsx` | 수정 | 로컬 타입 제거, `home.ts`에서 import |
| `src/components/home/IssueCard.tsx` | 수정 | 로컬 타입 제거, `home.ts`에서 import |
| `src/components/layout/RedditLayout.tsx` | 수정 | `fetchHomeRecommend` import 정렬 |
| `src/app/page.tsx` | 수정 | 정적 → `"use client"` 동적 컴포넌트 |

## API 스펙

### `GET /api/v1/home/recommend`

- 인증: Optional (비로그인 시 빈 결과 또는 기본 추천)
- 쿼리 파라미터: `page` (커서, 마지막 `chatRoomId`)

### 응답 타입

```typescript
interface HomeRecommendResponse {
  breakingNews: { title: string; url: string }[];        // UI 미사용 (타입만 준비)
  top5BestChatRooms: BestChatRoom[];                     // 사이드바에서 사용
  top5BestIssueRooms: BestIssueRoom[];                   // "핫한 토론 주제" 섹션
  chatRoomResponse: ChatRoomResponse[];                  // "실시간 토론장" 섹션
}
```

주요 DTO:

```typescript
interface BestIssueRoom {
  issueId: number;
  title: string;
  createdAt: string;
  countChatRoom: number;
  bookMarks: number;
}

interface ChatRoomResponse {
  chatRoomId: number;
  title: string;
  content: string;
  agree: number;
  disagree: number;
  createdAt: string;
  opinion: "AGREE" | "DISAGREE";
  time: string;           // "29분 전" 같은 상대 시간 (서버 계산)
}

interface BestChatRoom {
  issueId: number;
  issueTitle: string;
  debateId: number;
  debateTitle: string;
  time: string;
}
```

## 홈 화면 동작 흐름

```
페이지 진입
  │
  ├─ Zustand hydration 대기 (_hasHydrated)
  │     └─ 스켈레톤 UI 표시
  │
  ├─ 비로그인 → 로그인 유도 화면
  │
  └─ 로그인 상태
        │
        ├─ fetchHomeRecommend(accessToken) 호출
        │     ├─ 성공 → bestIssues, chatRooms 렌더링
        │     └─ 실패 → 에러 메시지 + "다시 시도" 버튼
        │
        └─ "더보기" 버튼 클릭
              └─ fetchHomeRecommend(token, lastChatRoomId)
                    ├─ 응답 3개 미만 → hasMore = false, 버튼 숨김
                    └─ 응답 3개 이상 → 목록에 추가, 버튼 유지
```

## 페이지네이션

- **방식**: 커서 기반 ("더보기" 버튼)
- **커서 값**: 현재 목록의 마지막 `chatRoomId`
- **종료 조건**: 서버 응답의 `chatRoomResponse`가 3개 미만

## UI 상태

| 상태 | 표시 |
|------|------|
| Hydration 대기 / 로딩 | `SkeletonShell` (가로 3개 + 세로 3개 pulse 카드) |
| 비로그인 | "토론철에 오신 것을 환영합니다" + 로그인 버튼 |
| 에러 (데이터 없음) | 에러 메시지 + "다시 시도" 버튼 (`retryKey` 증가로 재시도) |
| 에러 (데이터 있음) | 기존 데이터 유지 + 하단 에러 텍스트 |
| 데이터 없음 | "아직 등록된 토론이 없습니다" |
| 정상 | 핫한 토론 주제 + 실시간 토론장 + 더보기 버튼 |

## API 클라이언트 (`apiFetch`)

`src/lib/api/client.ts`의 `apiFetch<T>()` 함수를 사용한다.

- 브라우저: `/proxy` 경로를 통해 Next.js rewrites로 백엔드 프록시
- 서버(SSR): `API_BASE_URL` 환경변수로 직접 호출
- `token`이 주어지면 `Authorization: Bearer` 헤더 자동 첨부
- 응답의 `{ status, code, message, data }` envelope에서 `data`만 추출 반환
- 타임아웃: 기본 10초 (`AbortController`)

## 의사결정 기록

| 항목 | 결정 | 이유 |
|------|------|------|
| 페이지네이션 | "더보기" 버튼 | 무한스크롤 대비 구현 단순, 추후 전환 가능 |
| 상태 관리 | `useState` + `useEffect` | 새 의존성 불필요, 단순 fetch에 충분 |
| breakingNews UI | 미구현 (타입만) | 디자인 미확정, 다음 단계에서 작업 |
| 에러 재시도 | `retryKey` 패턴 | useEffect deps에 key를 넣어 선언적 재실행 |
