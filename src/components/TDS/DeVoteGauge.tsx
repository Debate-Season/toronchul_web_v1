import { getVoteRatio } from "@/lib/vote";

export type DeVoteGaugeSize = "sm" | "md" | "lg";

interface DeVoteGaugeProps {
  /** 찬성 표 수(퍼센트 아님) */
  agree: number;
  /** 반대 표 수(퍼센트 아님) */
  disagree: number;
  /** sm: 추천 토론 카드 / md: 이슈 카드 / lg: 토론방 상세 */
  size: DeVoteGaugeSize;
  /** 참여 인원수 노출. lg 전용 */
  showCount?: boolean;
  /** false 면 결과를 가리고 ??% 로 표시 */
  revealed?: boolean;
}

// 트랙 높이
const TRACK_H: Record<DeVoteGaugeSize, string> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

// 우세측 / 열세측 타이포 위계
const WIN_TEXT: Record<DeVoteGaugeSize, string> = {
  sm: "text-header-18",
  md: "text-header-18",
  lg: "text-header-24",
};
const LOSE_TEXT: Record<DeVoteGaugeSize, string> = {
  sm: "text-header-18",
  md: "text-body-14",
  lg: "text-body-16",
};

/**
 * 찬반 게이지. 찬성은 항상 좌측·적색, 반대는 항상 우측·청색.
 * 우세측 수치만 크게, 열세측은 같은 색을 유지하되 작고 흐리게 후퇴시켜 위계를 만든다.
 */
export default function DeVoteGauge({
  agree,
  disagree,
  size,
  showCount = false,
  revealed = true,
}: DeVoteGaugeProps) {
  const ratio = getVoteRatio(agree, disagree);
  const open = revealed && ratio !== null;

  // 바 폭은 실제 비율 그대로다. 예전엔 열세측이 사라지지 않도록 최소 4% 를
  // 보장했는데, 그러면 0% 인 쪽에도 색이 남아 "표가 있다"고 잘못 읽혔다.
  // 0% 는 0% 로 보여야 한다.
  const agreeWidth = ratio ? ratio.agreePercent : 0;

  // 한쪽이 0% 면 분기점이 트랙 끝이라 노치가 가장자리에 붙어 잘린 선처럼 보인다.
  const hasBothSides = open && ratio.agreePercent > 0 && ratio.disagreePercent > 0;

  const track = (
    <div
      role="img"
      aria-label={
        open
          ? `찬성 ${ratio.agreePercent}퍼센트, 반대 ${ratio.disagreePercent}퍼센트`
          : "투표 전"
      }
      className={`relative flex w-full overflow-hidden rounded-full bg-grey-80 ${TRACK_H[size]}`}
    >
      {open && (
        <>
          <div
            className="bg-red transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${agreeWidth}%` }}
          />
          <div
            className="bg-blue transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${100 - agreeWidth}%` }}
          />
          {/* 분기점 노치. sm 은 트랙이 얇아 노이즈가 되므로 제외 */}
          {size !== "sm" && hasBothSides && (
            <div
              className={`absolute inset-y-0 w-0.5 transition-[left] duration-500 ease-out motion-reduce:transition-none ${
                ratio.agreePercent === ratio.disagreePercent
                  ? "bg-brand"
                  : "bg-background"
              }`}
              style={{ left: `${agreeWidth}%` }}
            />
          )}
        </>
      )}
    </div>
  );

  // ── sm: 우세측 라벨 + 수치를 한 줄로 합쳐 우측 정렬 ──
  if (size === "sm") {
    const agreeWins = open && ratio.agreePercent >= ratio.disagreePercent;

    return (
      <div className="w-20 flex-shrink-0">
        <div className="mb-1.5 flex items-baseline justify-end gap-1 tabular-nums">
          {open ? (
            <>
              <span className="text-caption-12 font-semibold text-text-secondary">
                {agreeWins ? "찬성" : "반대"}
              </span>
              <span
                className={`${WIN_TEXT.sm} font-bold ${agreeWins ? "text-red" : "text-blue"}`}
              >
                {agreeWins ? ratio.agreePercent : ratio.disagreePercent}%
              </span>
            </>
          ) : (
            <span className={`${WIN_TEXT.sm} font-bold text-text-secondary`}>
              ??%
            </span>
          )}
        </div>
        {track}
      </div>
    );
  }

  // ── md / lg: 좌 찬성 · 우 반대 양측 표기 ──
  const tie = open && ratio.agreePercent === ratio.disagreePercent;
  const agreeWins = open && !tie && ratio.agreePercent > ratio.disagreePercent;
  const disagreeWins = open && !tie && !agreeWins;

  // 동률이면 우세측이 없으므로 양쪽 다 열세 스타일
  const pctCls = (wins: boolean) =>
    `${wins ? WIN_TEXT[size] : LOSE_TEXT[size]} font-bold`;
  const dimCls = (wins: boolean) =>
    open && !tie && !wins ? "opacity-60" : "";

  return (
    <div className="w-full">
      {track}
      <div className="mt-2 flex items-start justify-between gap-3 tabular-nums">
        {/* 찬성 (좌) */}
        <div className={`leading-tight ${dimCls(agreeWins)}`}>
          <div
            className={`${pctCls(agreeWins)} ${open ? "text-red" : "text-text-secondary"}`}
          >
            {open ? `${ratio.agreePercent}%` : "??%"}
          </div>
          <div
            className={`text-caption-12 font-semibold ${open ? "text-red" : "text-text-secondary"}`}
          >
            찬성
          </div>
          {showCount && (
            <div className="mt-0.5 text-caption-12 text-text-secondary">
              {agree}명
            </div>
          )}
        </div>

        {/* 반대 (우) */}
        <div className={`text-right leading-tight ${dimCls(disagreeWins)}`}>
          <div
            className={`${pctCls(disagreeWins)} ${open ? "text-blue" : "text-text-secondary"}`}
          >
            {open ? `${ratio.disagreePercent}%` : "??%"}
          </div>
          <div
            className={`text-caption-12 font-semibold ${open ? "text-blue" : "text-text-secondary"}`}
          >
            반대
          </div>
          {showCount && (
            <div className="mt-0.5 text-caption-12 text-text-secondary">
              {disagree}명
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
