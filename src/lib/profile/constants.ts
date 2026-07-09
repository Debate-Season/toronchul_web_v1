// ── 프로필 상수 ───────────────────────────────────────────
// 모바일 리포 profile_constants.dart + image_type.dart 포팅.

// ── 프로필 이미지(색상) ────────────────────────────────────
// PATCH /profiles/image 의 profileImage 값은 engName(대문자). 색은 globals.css 토큰(image-*).
export interface ImageColor {
  /** 백엔드 전송값 (대문자) */
  engName: string;
  /** 표시명 */
  name: string;
  /** Tailwind bg 토큰 클래스 (예: "bg-image-red") */
  bgClass: string;
}

export const IMAGE_COLORS: readonly ImageColor[] = [
  { engName: "RED", name: "빨강", bgClass: "bg-image-red" },
  { engName: "ORANGE", name: "주황", bgClass: "bg-image-orange" },
  { engName: "YELLOW", name: "노랑", bgClass: "bg-image-yellow" },
  { engName: "GREEN", name: "초록", bgClass: "bg-image-green" },
  { engName: "BLUE", name: "파랑", bgClass: "bg-image-blue" },
  { engName: "NAVY", name: "네이비", bgClass: "bg-image-navy" },
  { engName: "PURPLE", name: "보라", bgClass: "bg-image-purple" },
];

/** engName(대소문자 무관) → ImageColor. 매칭 실패 시 RED (모바일 fromEngName 미러). */
export function imageColorFromEngName(engName: string): ImageColor {
  const upper = (engName ?? "").toUpperCase();
  return IMAGE_COLORS.find((c) => c.engName === upper) ?? IMAGE_COLORS[0];
}

// ── 성별 ──────────────────────────────────────────────────
// 표시값 = 전송값 (한글 그대로 전송).
export const GENDERS = ["남성", "여성", "무응답"] as const;

// ── 연령대 ────────────────────────────────────────────────
// 표시값 = 전송값.
export const AGE_RANGES = [
  "10대", "20대", "30대", "40대", "50대",
  "60대", "70대", "80대", "90대 이상",
] as const;

// ── 닉네임 검증 ───────────────────────────────────────────
// 한글/영문만, 2~8자. (정규식은 1~8자 허용하나 길이체크가 2자 미만을 먼저 거름.)
export const NICKNAME_REGEX = /^[가-힣a-zA-Z]{1,8}$/;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 8;
export const NICKNAME_HINT = "한글, 영문 조합 최대 8자";
export const NICKNAME_INVALID_MSG = "유효하지 않은 닉네임입니다.";
export const NICKNAME_DUPLICATE_MSG = "중복된 닉네임입니다.";

/** 닉네임 형식 유효성 (길이 2~8 + 정규식). */
export function isValidNicknameFormat(nickname: string): boolean {
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return false;
  }
  return NICKNAME_REGEX.test(nickname);
}

// ── UI 문구 ───────────────────────────────────────────────
export const PROFILE_TEXT = {
  createAppBar: "프로필 입력",
  modifyAppBar: "프로필 수정",
  imageCreateAppBar: "프로필 사진 등록하기",
  imageModifyAppBar: "프로필 사진 편집하기",
  nextBtn: "다음",
  startBtn: "토론철 시작하기",
  modifyBtn: "완료",
  privacyNotice: "본 정보는 타인에게 공개되지 않습니다.",
  communityHint: "주로 활동하는 커뮤니티를 등록해 주세요.",
  ageHint: "나이대를 선택해주세요.",
  residenceHint: "거주지를 선택해주세요.",
  homeTownHint: "출신지를 선택해주세요.",
  sameToResidence: "거주지와 동일",
  choice: "선택하기",
  register: "등록하기",
} as const;

// ── 회원 탈퇴 문구 ────────────────────────────────────────
export const WITHDRAW_TEXT = {
  policyTitle: "탈퇴 정책 안내",
  procedureTitle: "절차",
  procedureDescription:
    "회원 탈퇴를 신청하면 계정이 로그아웃되고 5일 뒤 탈퇴가 진행됩니다. 삭제 전 다시 로그인하면 탈퇴를 취소할 수 있습니다.",
  warning: "탈퇴가 완료될 경우, 해당 아이는 복구가 불가능합니다.",
  deletedInfoTitle: "삭제되는 정보",
  deletedInfoPart1: "탈퇴가 완료되면 ",
  deletedInfoPart2: "고유아이디, 닉네임, 성별 정보",
  deletedInfoPart3: "가 삭제됩니다. 내가 선택한 진영과 작성한 대화는 삭제되지 않습니다.",
  dialogTitle: "회원 탈퇴 신청",
  dialogDescription:
    "회원 탈퇴를 신청하면 계정이 로그아웃되고 5일 뒤 회원 정보가 완전히 삭제됩니다.\n삭제 전 다시 로그인하면 탈퇴를 취소할 수 있습니다.\n탈퇴를 신청하시겠습니까?",
  doneText: "탈퇴 신청하기",
  cancelText: "탈퇴 취소",
  successMessage: "회원탈퇴 되었습니다.",
} as const;

// ── 외부 링크 ─────────────────────────────────────────────
/** 고객센터 카카오 채널 */
export const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_SZNxln";

/** 프로필 메인 "법적 정보 및 정책" 외부 링크 */
export const POLICY_LINKS = [
  {
    label: "개인정보 처리방침",
    url: "https://rosy-ocean.notion.site/1a9034a1724480dba1c3d5a0ce6b696e",
  },
  {
    label: "커뮤니티 이용가이드",
    url: "https://rosy-ocean.notion.site/215034a1724480c9ab1bd9f8f691b408",
  },
  {
    label: "아동 안전 표준 정책",
    url: "https://rosy-ocean.notion.site/191034a1724480c291faf94db9e895ef",
  },
] as const;

/** 약관 동의 현황 페이지(/profile/terms)의 3종 약관 */
export interface TermsItem {
  termsType: string;
  label: string;
  url: string;
}

export const TERMS_ITEMS: readonly TermsItem[] = [
  {
    termsType: "SERVICE",
    label: "서비스 이용약관 동의",
    url: "https://rosy-ocean.notion.site/18d034a172448095aa0ecc41849e9508",
  },
  {
    termsType: "PRIVACY",
    label: "개인정보 수집/이용 동의",
    url: "https://rosy-ocean.notion.site/24f034a172448015bcc9dc08af777c3e",
  },
  {
    termsType: "THIRD_PARTY",
    label: "개인정보 제3자 제공 동의",
    url: "https://rosy-ocean.notion.site/3-24f034a1724480848cbfe32283e0ea95",
  },
];
