import { create } from "zustand";

// ── Types ─────────────────────────────────────────
export interface YoutubePlayerItem {
  videoId: string;
  title: string;
  channel: string;
}

interface YoutubePlayerState {
  /** 현재 우하단 플로팅으로 재생 중인 영상. 없으면 null. */
  current: YoutubePlayerItem | null;
}

interface YoutubePlayerActions {
  open: (item: YoutubePlayerItem) => void;
  close: () => void;
}

// ── Store ─────────────────────────────────────────
// 휘발성 UI 상태(재생 중 영상)이므로 persist 없음 → _hasHydrated 가드 불필요.
const useYoutubePlayerStore = create<
  YoutubePlayerState & YoutubePlayerActions
>((set) => ({
  current: null,
  open: (item) => set({ current: item }),
  close: () => set({ current: null }),
}));

export default useYoutubePlayerStore;
