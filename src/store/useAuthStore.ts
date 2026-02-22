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

export default useAuthStore;
