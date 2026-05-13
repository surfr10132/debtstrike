import { Metadata } from "next";
import { getCollectorBySlug, getAllCollectorSlugs } from "@/lib/collectors";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ "collector-slug": string }>;
}

export async function generateStaticParams() {
  const slugs = getAllCollectorSlugs();
  return [
    ...slugs.map((slug) => ({ "collector-slug": slug })),
    { "collector-slug": "debt-letter" }, // generic version
  ];
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { "collector-slug": slug } = await params;

  if (slug === "debt-letter") {
    return {
      title:
        "Got a Letter from a Debt Collector? Respond in 5 Minutes | DebtStrike.io",
      description:
        "Upload your debt collection letter and get a legally-referenced Debt Validation & Cease and Desist response in minutes. $20, no account needed. Stop collector calls today.",
      openGraph: {
        title: "Got a Letter from a Debt Collector?",
        description:
          "Upload it. We write your legal response. $20, done in 5 minutes.",
        url: "https://debtstrike.io/go/debt-letter",
        type: "website",
        siteName: "DebtStrike.io",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      },
      robots: {
        index: false, // Don't index landing pages — they're for ads
        follow: true,
      },
    };
  }

  const collector = getCollectorBySlug(slug);

  if (!collector) {
    return {
      title: "DebtStrike.io - Fight Back Against Debt Collectors",
    };
  }

  return {
    title: `Got a Letter from ${collector.name}? Respond in 5 Minutes | DebtStrike.io`,
    description: `${collector.name} sent you a letter? Upload it and get a Debt Validation & Cease and Desist response in minutes. ${collector.description} $20, no account needed.`,
    openGraph: {
      title: `Got a Letter from ${collector.name}?`,
      description: `Upload it. We write your legal response to ${collector.shortName}. $20, done in 5 minutes.`,
      url: `https://debtstrike.io/go/${collector.slug}`,
      type: "website",
      siteName: "DebtStrike.io",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default function GoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
