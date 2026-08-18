import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PostHog 수집 엔드포인트가 트레일링 슬래시 경로를 쓴다. 끄지 않으면 Next 의
  // 자동 리다이렉트가 프록시 요청을 가로챈다.
  // 부수 효과: `/foo/` → `/foo` 정규화가 사라진다. 우리 링크는 전부 슬래시 없이
  // 생성되므로 실사용 영향은 없다(v0.8.0 PRD §3.4).
  skipTrailingSlashRedirect: true,

  async rewrites() {
    const apiBase = process.env.API_BASE_URL ?? "https://api.toronchul.app/prod";
    // PostHog 리전. 수집·자산 호스트만 갈리고 클라이언트 코드는 무관하다.
    const phRegion = process.env.POSTHOG_REGION ?? "us";
    return [
      // 기존: 웹 클라이언트의 API 프록시
      {
        source: "/proxy/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
      // 안전망: DNS 컷오버 후 toronchul.app으로 들어오는 구버전 앱의 REST 호출을 api 서버로 전달
      {
        source: "/prod/:path*",
        destination: "https://api.toronchul.app/prod/:path*",
      },
      // 안전망: DB에 toronchul.app/images 절대경로로 저장된 기존 이미지 요청을 api 서버로 전달
      {
        source: "/images/:path*",
        destination: "https://api.toronchul.app/images/:path*",
      },
      // PostHog 리버스 프록시. 우리 도메인을 거쳐야 광고 차단기·ITP 에 막히지
      // 않는다. 경로를 `/analytics` 같은 뻔한 이름으로 두면 차단 규칙에 걸리므로
      // 중립적인 `/relay` 를 쓴다. 정적 자산 규칙이 먼저 와야 한다 — 아래
      // catch-all 이 `/relay/static/*` 까지 먹어버린다.
      {
        source: "/relay/static/:path*",
        destination: `https://${phRegion}-assets.i.posthog.com/static/:path*`,
      },
      {
        source: "/relay/array/:path*",
        destination: `https://${phRegion}-assets.i.posthog.com/array/:path*`,
      },
      {
        source: "/relay/:path*",
        destination: `https://${phRegion}.i.posthog.com/:path*`,
      },
    ];
  },
};

export default nextConfig;
