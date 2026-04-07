import { NextResponse } from "next/server";

/**
 * Apple Sign In form_post 콜백.
 *
 * Apple 은 response_mode=form_post 로 설정 시 이 URL 로
 * POST (application/x-www-form-urlencoded) 를 보낸다.
 * id_token, code, state 를 추출한 뒤 클라이언트 페이지
 * /oauth/callback/apple 로 GET 리다이렉트한다.
 */
export async function POST(request: Request) {
  const formData = await request.formData();

  const idToken = formData.get("id_token")?.toString() ?? "";
  const state = formData.get("state")?.toString() ?? "";
  const error = formData.get("error")?.toString() ?? "";

  const callbackUrl = new URL("/oauth/callback/apple", request.url);

  if (error) {
    callbackUrl.searchParams.set("error", error);
  } else if (idToken) {
    callbackUrl.searchParams.set("id_token", idToken);
    callbackUrl.searchParams.set("state", state);
  } else {
    callbackUrl.searchParams.set("error", "missing_id_token");
  }

  return NextResponse.redirect(callbackUrl, { status: 303 });
}
