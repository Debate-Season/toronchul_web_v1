"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { voteRoom, type VoteOpinion, type ThreadOpinion } from "@/lib/api/room";
import useAuthStore from "@/store/useAuthStore";
import LoginModal from "@/components/auth/LoginModal";
import DeConfirmDialog from "@/components/TDS/DeConfirmDialog";
import DeVoteGauge from "@/components/TDS/DeVoteGauge";

interface ThreadVoteBarProps {
  threadId: number;
  agreeCount: number;
  disagreeCount: number;
  myOpinion: ThreadOpinion;
  /** 투표 성공 후 스레드 목록 재조회 트리거 */
  onVoted: () => void;
}

/**
 * 선택된 토론 주제(스레드)의 찬반 현황 + 투표. **`ThreadPanel` 안에 놓인다** —
 * 카드 테두리·패딩·주제 제목은 패널 쪽 책임이라 여기서는 내용만 그린다.
 *
 * 투표는 **입장 조건이 아니다** — 투표하지 않아도 대화는 읽고 쓸 수 있고,
 * 투표하면 내 말풍선의 정렬·색만 달라진다. 투표 API 는 스레드 단위이므로
 * 옛 방 id 를 그대로 쓰는 `POST /api/v1/room/vote` 에 threadId 를 넘긴다.
 */
export default function ThreadVoteBar({
  threadId,
  agreeCount,
  disagreeCount,
  myOpinion,
  onVoted,
}: ThreadVoteBarProps) {
  const { accessToken, isLogin } = useAuthStore();

  const [voting, setVoting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingVote, setPendingVote] = useState<VoteOpinion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasVoted = myOpinion === "AGREE" || myOpinion === "DISAGREE";

  // 투표 버튼 클릭 → 로그인 게이팅 후 컨펌 모달 오픈(즉시 투표하지 않음).
  const handleVoteClick = (choice: VoteOpinion) => {
    if (!isLogin) {
      setShowLogin(true);
      return;
    }
    if (voting) return;
    setPendingVote(choice);
  };

  const confirmVote = async () => {
    const choice = pendingVote;
    setPendingVote(null);
    if (!choice || voting) return;
    setVoting(true);
    setError(null);
    try {
      await voteRoom(threadId, choice, accessToken);
      onVoted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "투표에 실패했습니다.");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <DeVoteGauge agree={agreeCount} disagree={disagreeCount} size="md" />

      <div className="flex gap-2">
        <VoteButton
          label="찬성"
          tone="red"
          icon={<ThumbsUp size={14} />}
          selected={myOpinion === "AGREE"}
          disabled={voting}
          onClick={() => handleVoteClick("AGREE")}
        />
        <VoteButton
          label="반대"
          tone="blue"
          icon={<ThumbsDown size={14} />}
          selected={myOpinion === "DISAGREE"}
          disabled={voting}
          onClick={() => handleVoteClick("DISAGREE")}
        />
      </div>

      {error && <p className="text-caption-12 text-red">{error}</p>}

      {pendingVote && (
        <DeConfirmDialog
          title={`${pendingVote === "AGREE" ? "찬성으로" : "반대로"} 입장을 ${
            hasVoted ? "변경" : "선택"
          }할까요?`}
          doneText={hasVoted ? "변경" : "선택"}
          cancelText="취소"
          onDone={confirmVote}
          onCancel={() => setPendingVote(null)}
        />
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// ── Vote 버튼 ─────────────────────────────────────
function VoteButton({
  label,
  tone,
  icon,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  tone: "red" | "blue";
  icon: React.ReactNode;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const selectedCls =
    tone === "red"
      ? "border-red bg-red text-white"
      : "border-blue bg-blue text-white";
  const idleCls =
    tone === "red"
      ? "border-border text-red hover:border-red"
      : "border-border text-blue hover:border-blue";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-body-14 font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer ${
        selected ? selectedCls : idleCls
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
