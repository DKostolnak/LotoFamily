import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { GameProvider } from "@/lib/GameContext";
import { ToastProvider } from "@/components/ToastProvider";
import { GameStatusListener } from "@/components/GameStatusListener";

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
        <GameProvider>
          <ToastProvider>
            <GameStatusListener />
            {children}
          </ToastProvider>
        </GameProvider>
      </body>
    </html>
  );
}

