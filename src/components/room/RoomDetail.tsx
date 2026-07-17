"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  fetchRoomDetail,
  voteRoom,
  type RoomDetailResponse,
  type VoteOpinion,
} from "@/lib/api/room";
import useAuthStore from "@/store/useAuthStore";
import LoginModal from "@/components/auth/LoginModal";
import DeConfirmDialog from "@/components/TDS/DeConfirmDialog";

// 찬반 비율(%). 표 없으면 50/50 (앱 공통 규칙).
function getPercentages(agree: number, disagree: number) {
  const total = agree + disagree;
  if (total === 0) return { agreePercent: 50, disagreePercent: 50 };
  const agreePercent = Math.round((agree / total) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent };
}

interface RoomDetailProps {
  roomId: number;
  backHref: string;
  backLabel: string;
}

/**
 * 토론방(찬반) 상세. 찬반 투표 → 투표해야 "입장하기" 활성.
 * 비로그인 유저가 투표/입장 시도 시 로그인 모달. 팀 점수 섹션은 숨김.
 * /room/[id] 와 이슈 하위 중첩 라우트가 공용으로 사용.
 */
export default function RoomDetail({
  roomId,
  backHref,
  backLabel,
}: RoomDetailProps) {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<RoomDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [voting, setVoting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingVote, setPendingVote] = useState<VoteOpinion | null>(null);

  useEffect(() => {
    if (!_hasHydrated || !roomId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchRoomDetail(roomId, accessToken);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "토론방을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, accessToken, roomId, retryKey]);

  const opinion = data?.opinion ?? "";
  const hasVoted = opinion === "AGREE" || opinion === "DISAGREE";

  // 투표 버튼 클릭 → 로그인 게이팅 후 컨펌 모달 오픈(즉시 투표하지 않음).
  const handleVoteClick = (choice: VoteOpinion) => {
    if (!isLogin) {
      setShowLogin(true);
      return;
    }
    if (voting) return;
    setPendingVote(choice);
  };

  // 컨펌 후 실제 투표 → 재조회로 opinion·찬반수 갱신.
  const confirmVote = async () => {
    const choice = pendingVote;
    setPendingVote(null);
    if (!choice || voting) return;
    setVoting(true);
    try {
      await voteRoom(roomId, choice, accessToken);
      setRetryKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "투표에 실패했습니다.");
    } finally {
      setVoting(false);
    }
  };

  const handleEnter = () => {
    if (!isLogin) {
      setShowLogin(true);
      return;
    }
    if (!hasVoted) return;
    router.push(`/room/${roomId}/chat`);
  };

  if (!_hasHydrated || loading) return <SkeletonShell />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 text-red">
          {error ?? "토론방을 불러오지 못했습니다."}
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { agreePercent, disagreePercent } = getPercentages(
    data.agree,
    data.disagree,
  );

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* 뒤로가기 */}
      <Link
        href={backHref}
        className="flex items-center gap-1 text-caption-12 text-text-secondary w-fit"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </Link>

      {/* 헤더 */}
      <div>
        <h1 className="text-header-20 font-bold text-text-primary">
          {data.title}
        </h1>
        {data.content && (
          <p className="mt-2 whitespace-pre-wrap text-body-14 text-text-secondary">
            {data.content}
          </p>
        )}
      </div>

      {/* 찬반 투표 (게이지 위) */}
      <section>
        <div className="flex gap-3">
          <VoteButton
            label="찬성"
            tone="red"
            icon={<ThumbsUp size={18} />}
            selected={opinion === "AGREE"}
            disabled={voting}
            onClick={() => handleVoteClick("AGREE")}
          />
          <VoteButton
            label="반대"
            tone="blue"
            icon={<ThumbsDown size={18} />}
            selected={opinion === "DISAGREE"}
            disabled={voting}
            onClick={() => handleVoteClick("DISAGREE")}
          />
        </div>
      </section>

      {/* 찬반 현황 게이지 */}
      <section>
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          <div className="bg-red transition-all" style={{ width: `${agreePercent}%` }} />
          <div className="bg-blue transition-all" style={{ width: `${disagreePercent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-body-14 font-semibold text-red">
            찬성 {data.agree}명 ({agreePercent}%)
          </span>
          <span className="text-body-14 font-semibold text-blue">
            반대 {data.disagree}명 ({disagreePercent}%)
          </span>
        </div>
      </section>

      {/* 입장하기 (투표해야 활성) */}
      <button
        type="button"
        onClick={handleEnter}
        disabled={!hasVoted}
        className={`w-full rounded-xl py-3.5 text-body-16 font-semibold transition-colors ${
          hasVoted
            ? "bg-brand text-white hover:opacity-90 cursor-pointer"
            : "bg-grey-90 text-text-secondary cursor-not-allowed"
        }`}
      >
        토론방 입장하기
      </button>

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
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-body-16 font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer ${
        selected ? selectedCls : idleCls
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────
function SkeletonShell() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="h-4 w-16 rounded bg-grey-90 animate-pulse" />
      <div className="h-8 w-3/4 rounded bg-grey-90 animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-grey-90 animate-pulse" />
      <div className="h-3 w-full rounded-full bg-grey-90 animate-pulse" />
      <div className="flex gap-3">
        <div className="h-12 flex-1 rounded-xl bg-grey-90 animate-pulse" />
        <div className="h-12 flex-1 rounded-xl bg-grey-90 animate-pulse" />
      </div>
      <div className="h-12 w-full rounded-xl bg-grey-90 animate-pulse" />
    </div>
  );
}
