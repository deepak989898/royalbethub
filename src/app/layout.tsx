import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PublicShell } from "@/components/PublicShell";
import { getSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RoyalBetHub | Best casino apps & online betting India (affiliate hub)",
    template: "%s | RoyalBetHub",
  },
  description:
    "Compare the best casino apps in India, online betting real money options, welcome bonuses, UPI-friendly brands, and editorial reviews. 18+ affiliate hub—not a gambling operator.",
  keywords: [
    "RoyalBetHub",
    "best casino apps in India",
    "online betting real money India",
    "1xbet review India",
    "casino affiliate India",
    "UPI casino India",
    "welcome bonus casino India",
    "how to withdraw betting India",
    "is online betting legal India",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "RoyalBetHub",
    title: "RoyalBetHub — WIN LIKE ROYALTY (affiliate comparisons)",
    description:
      "India-focused casino & betting comparisons, bonus offers, reviews, and blog guides. 18+ only.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoyalBetHub | Casino & betting comparisons (India)",
    description: "Editorial picks, tracked partner links, and bonus resources. 18+ only.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/brand/royalbethub-logo.png",
    apple: "/brand/royalbethub-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0c0a12] font-sans text-zinc-100">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
