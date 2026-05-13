import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://debtstrike.io"),
  title: "DebtStrike.io - Fight Back Against Debt Collectors",
  description:
    "Generate a professional debt validation and cease & desist letter in minutes. Stop harassing debt collector calls. Know your rights under the FDCPA.",
  verification: {
    google: "tUllMXA9NHZfUiZ_obNbtbCtvosmEfQHqmHwVuvBzX0",
  },
  openGraph: {
    title: "DebtStrike.io - Fight Back Against Debt Collectors",
    description:
      "Generate a professional debt validation and cease & desist letter in minutes. Stop harassing debt collector calls. Know your rights under the FDCPA.",
    url: "https://debtstrike.io",
    type: "website",
    siteName: "DebtStrike.io",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DebtStrike.io - Fight Back Against Debt Collectors",
    description:
      "Generate a professional debt validation and cease & desist letter in minutes. Stop harassing debt collector calls. Know your rights under the FDCPA.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://debtstrike.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
