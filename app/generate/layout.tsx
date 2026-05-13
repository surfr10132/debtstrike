import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Your Letter | DebtStrike.io",
  description:
    "Upload a debt collection letter or enter collector details to generate a personalized debt validation and cease-and-desist letter citing the FDCPA. Ready in 60 seconds.",
  openGraph: {
    title: "Generate Your Letter | DebtStrike.io",
    description:
      "Upload a debt collection letter or enter collector details to generate a personalized debt validation and cease-and-desist letter citing the FDCPA.",
    url: "https://debtstrike.io/generate",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Generate Your Letter | DebtStrike.io",
    description:
      "Upload a debt collection letter or enter collector details to generate a personalized FDCPA letter. Ready in 60 seconds.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://debtstrike.io/generate",
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
