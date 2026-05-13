import { MetadataRoute } from "next";
import { getAllCollectorSlugs } from "@/lib/collectors";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://debtstrike.io";
  const collectorSlugs = getAllCollectorSlugs();

  const contentPages = [
    "midland-credit-management",
    "portfolio-recovery-associates",
    "debt-validation-letter-template",
    "cease-and-desist-letter-debt-collectors",
    "what-is-a-debt-validation-letter",
    "11-words-to-stop-debt-collectors",
    "777-rule-debt-collectors",
    "fdcpa-rights",
    "statute-of-limitations-on-debt",
    "what-happens-if-you-ignore-debt-collectors",
    "can-debt-collectors-call-your-family",
    "debt-collector-harassment",
    "medical-debt-validation-letter",
    "does-debt-validation-stop-collections",
    "how-long-does-collections-stay-on-credit-report",
    "california-debt-collection-laws",
    "lvnv-funding",
    "encore-capital-group",
    "ic-system",
    "convergent-outsourcing",
    "national-credit-systems",
    "jefferson-capital-systems",
    "enhanced-recovery-company",
    "alorica",
    "credit-corp-solutions",
    "transworld-systems",
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/generate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...contentPages.map((slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/credit-repair`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Google Ads landing pages
    {
      url: `${baseUrl}/go/debt-letter`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...collectorSlugs.map((slug) => ({
      url: `${baseUrl}/go/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
