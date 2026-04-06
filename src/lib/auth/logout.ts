import useAuthStore from "@/store/useAuthStore";
import { logoutFromServer } from "@/lib/api/auth";

/** 서버 revoke 후 로컬 상태 클리어. revoke 실패해도 로컬은 항상 클리어. */
export async function performLogout(): Promise<void> {
  const { refreshToken } = useAuthStore.getState();

  if (refreshToken) {
    await logoutFromServer(refreshToken).catch(() => {});
  }

  useAuthStore.getState().logout();
}
