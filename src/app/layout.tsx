import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "건기식 성분·가격 비교 (Super-Calc)",
    template: "%s | Super-Calc",
  },
  description: "실시간 1일 단가 계산 + 의학 팩트체크 + 1탭 공유 (Anti-BS Dashboard)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
