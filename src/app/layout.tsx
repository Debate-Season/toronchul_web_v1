import type { Metadata } from "next";
import RedditLayout from "@/components/layout/RedditLayout";
import Analytics from "@/components/analytics/Analytics";
import JsonLd from "@/components/seo/JsonLd";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  // og:image 등 상대경로 자산을 절대 URL 로 승격시킨다. 없으면 Next 가 경고를
  // 내고 카카오/트위터 스크래퍼가 이미지를 못 읽는다.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 이슈와 토론`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // canonical 은 여기 두지 않는다 — 하위 페이지가 전부 홈을 정식형으로 상속한다.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
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
        <JsonLd data={organizationJsonLd()} />
        <Analytics />
        <RedditLayout>{children}</RedditLayout>
        {modal}
      </body>
    </html>
  );
}
