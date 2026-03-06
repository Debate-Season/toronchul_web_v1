import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLogin: boolean;
  profileStatus: boolean | null;
  termsStatus: boolean | null;
  /** localStorage → 메모리 복원이 완료되었는지 여부 */
  _hasHydrated: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setProfileStatus: (status: boolean) => void;
  setTermsStatus: (status: boolean) => void;
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
    },
  ),
);

// zustand v5: persist.onFinishHydration으로 hydration 완료 감지
if (typeof window !== "undefined") {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ _hasHydrated: true });
  });
  // 이미 hydration이 끝난 경우 대비
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ _hasHydrated: true });
  }
}

export default useAuthStore;
