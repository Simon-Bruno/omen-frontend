import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AnalyticsProvider } from "@/contexts/analytics-context";
import Header from "@/components/Header";

const dmSans = localFont({
  src: [
    {
      path: "../public/fonts/DMSans-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-Italic-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  // Map to the existing CSS variable so globals continue to reference it
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omen - eCommerce UX Co-Pilot",
  description: "eCommerce UX Co-Pilot powered by AI",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/logo.png', sizes: '116x116', type: 'image/png' }
    ],
    apple: [
      { url: '/assets/logo.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <AnalyticsProvider>
            <Header />
            {children}
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
