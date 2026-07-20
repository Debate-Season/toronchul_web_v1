export interface VoteRatio {
  agreePercent: number;
  disagreePercent: number;
  total: number;
}

/**
 * 찬반 비율(%) 계산. 표가 하나도 없으면 null — 호출부에서 "투표 전"으로 분기.
 * 50/50 을 반환하면 "투표 전"과 "완벽한 접전"이 구분되지 않으므로 반환하지 않는다.
 * disagreePercent 는 100 - agreePercent 로 도출해 합이 항상 100 이 되게 한다.
 */
export function getVoteRatio(agree: number, disagree: number): VoteRatio | null {
  const total = agree + disagree;
  if (total <= 0) return null;
  const agreePercent = Math.round((agree / total) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent, total };
}
