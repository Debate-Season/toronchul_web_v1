import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────
type ProfileStatus = "INCOMPLETE" | "COMPLETE";
type TermsStatus = "NOT_AGREED" | "AGREED";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLogin: boolean;
  profileStatus: ProfileStatus | null;
  termsStatus: TermsStatus | null;
  /** localStorage → 메모리 복원이 완료되었는지 여부 */
  _hasHydrated: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setProfileStatus: (status: ProfileStatus) => void;
  setTermsStatus: (status: TermsStatus) => void;
  logout: () => void;
}

// ── Store ─────────────────────────────────────────
const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      accessToken: null,
      refreshToken: null,
      isLogin: false,
      profileStatus: null,
      termsStatus: null,
      _hasHydrated: false,

      // Actions
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isLogin: true }),

      setProfileStatus: (profileStatus) => set({ profileStatus }),

      setTermsStatus: (termsStatus) => set({ termsStatus }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isLogin: false,
          profileStatus: null,
          termsStatus: null,
        }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

// ── 클라이언트 hydration 안전장치 ──
// onRehydrateStorage 콜백이 누락될 수 있으므로 이중으로 보장
if (typeof window !== "undefined") {
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ _hasHydrated: true });
  }
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ _hasHydrated: true });
  });
}

export default useAuthStore;
