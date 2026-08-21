import type { Metadata } from "next";
import RedditLayout from "@/components/layout/RedditLayout";
import Analytics from "@/components/analytics/Analytics";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toronchul.app";
const SITE_NAME = "토론철";
const SITE_DESCRIPTION = "토론철 - 토론 플랫폼";

export const metadata: Metadata = {
  // og:image 등 상대경로 자산을 절대 URL 로 승격시킨다. 없으면 Next 가 경고를
  // 내고 카카오/트위터 스크래퍼가 이미지를 못 읽는다.
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "ko_KR",
    // 1.91:1 가로 카드. 명시하지 않으면 스크래퍼가 페이지에서 가장 큰 이미지
    // (정사각 스플래시 로고)를 골라 좌우가 잘린다.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Analytics />
        <RedditLayout>{children}</RedditLayout>
        {modal}
      </body>
    </html>
  );
}
