import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://toronchul.app/prod";

/** 백엔드로 전달할 헤더만 필터링 */
function forwardHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const allow = ["authorization", "content-type", "accept"];
  for (const key of allow) {
    const v = req.headers.get(key);
    if (v) headers[key] = v;
  }
  return headers;
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${API_BASE}/${path.join("/")}${req.nextUrl.search}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(target, {
      method: req.method,
      headers: forwardHeaders(req),
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
      signal: controller.signal,
    });

    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { status: 503, code: "PROXY_ERROR", message: "백엔드 서버에 연결할 수 없습니다.", data: null },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
