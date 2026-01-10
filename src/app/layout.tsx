import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { GameProvider } from "@/lib/GameContext";
import { P2PProvider } from "@/lib/p2p/P2PContext";
import { ToastProvider } from "@/components/ToastProvider";
import ScreenShakeProvider from "@/components/ScreenShakeProvider";
import { GameStatusListener } from "@/components/GameStatusListener";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AchievementToastContainer from "@/components/AchievementToastContainer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Loto - Family Game",
  description: "Traditional European Loto game for family game nights",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Loto",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#5d4037",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} wood-bg`} suppressHydrationWarning>
        <ErrorBoundary>
          <P2PProvider>
            <GameProvider>
              <ToastProvider>
                <ScreenShakeProvider>
                  <GameStatusListener />
                  <AchievementToastContainer />
                  {children}
                </ScreenShakeProvider>
              </ToastProvider>
            </GameProvider>
          </P2PProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
