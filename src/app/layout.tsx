import type { Metadata } from "next";
import RedditLayout from "@/components/layout/RedditLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "토론철",
  description: "토론철 - 토론 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <RedditLayout>{children}</RedditLayout>
      </body>
    </html>
  );
}
