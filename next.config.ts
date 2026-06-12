import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.API_BASE_URL ?? "https://api.toronchul.app/prod";
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
    ];
  },
};

export default nextConfig;
