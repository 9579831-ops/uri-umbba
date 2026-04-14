import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "부모안심 - 장기요양 사전 예측 서비스",
  description: "우리 부모님 요양 필요한지 전문가 수준으로 무료 확인하세요. 장기요양 등급 사전 판별, 2026년 수가 기반 비용 계산, AI 추천 명언까지.",
  keywords: "장기요양, 요양등급, 요양비용, 부모돌봄, 치매, 요양보호사, 부모안심",
  manifest: "/manifest.json",
  icons: { apple: "/icon-192.png" },
  openGraph: {
    title: "부모안심 - 우리 부모님 요양 필요할까?",
    description: "1분이면 충분합니다. 장기요양 등급 사전 판별, 비용 계산, AI 명언까지.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1A6B4B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif", background: "#F7F6F3" }}>
        {children}
      </body>
    </html>
  );
}
