import Link from "next/link";

interface Article {
  slug: string;
  title: string;
}

// All content pages with their titles for cross-linking
const ALL_ARTICLES: Article[] = [
  { slug: "debt-validation-letter-template", title: "Free Debt Validation Letter Template" },
  { slug: "what-is-a-debt-validation-letter", title: "What Is a Debt Validation Letter?" },
  { slug: "cease-and-desist-letter-debt-collectors", title: "Cease and Desist Letter for Debt Collectors" },
  { slug: "fdcpa-rights", title: "Your Rights Under the FDCPA" },
  { slug: "11-words-to-stop-debt-collectors", title: "11 Words to Stop Debt Collectors" },
  { slug: "777-rule-debt-collectors", title: "The 7-7-7 Rule for Debt Collectors" },
  { slug: "debt-collector-harassment", title: "Debt Collector Harassment: What to Do" },
  { slug: "does-debt-validation-stop-collections", title: "Does Debt Validation Stop Collections?" },
  { slug: "statute-of-limitations-on-debt", title: "Statute of Limitations on Debt by State" },
  { slug: "what-happens-if-you-ignore-debt-collectors", title: "What Happens If You Ignore Debt Collectors?" },
  { slug: "can-debt-collectors-call-your-family", title: "Can Debt Collectors Call Your Family?" },
  { slug: "how-long-does-collections-stay-on-credit-report", title: "How Long Does Collections Stay on Your Credit Report?" },
  { slug: "medical-debt-validation-letter", title: "Medical Debt Validation Letter" },
  { slug: "california-debt-collection-laws", title: "California Debt Collection Laws" },
  { slug: "midland-credit-management", title: "Midland Credit Management: How to Respond" },
  { slug: "portfolio-recovery-associates", title: "Portfolio Recovery Associates: How to Respond" },
  { slug: "lvnv-funding", title: "LVNV Funding: How to Respond" },
  { slug: "encore-capital-group", title: "Encore Capital Group: How to Respond" },
  { slug: "ic-system", title: "IC System: How to Respond" },
  { slug: "cbe-group", title: "CBE Group: How to Respond" },
  { slug: "convergent-outsourcing", title: "Convergent Outsourcing: How to Respond" },
  { slug: "national-credit-systems", title: "National Credit Systems: How to Respond" },
  { slug: "cavalry-spv", title: "Cavalry SPV: How to Respond" },
  { slug: "jefferson-capital-systems", title: "Jefferson Capital Systems: How to Respond" },
  { slug: "unifin", title: "Unifin: How to Respond" },
  { slug: "cach-llc", title: "CACH LLC: How to Respond" },
  { slug: "alorica", title: "Alorica: How to Respond" },
  { slug: "credit-corp-solutions", title: "Credit Corp Solutions: How to Respond" },
  { slug: "receivables-performance-management", title: "Receivables Performance Management: How to Respond" },
];

// Relevance mapping — which articles are related to each other
const RELATED_MAP: Record<string, string[]> = {
  "debt-validation-letter-template": ["what-is-a-debt-validation-letter", "does-debt-validation-stop-collections", "cease-and-desist-letter-debt-collectors"],
  "what-is-a-debt-validation-letter": ["debt-validation-letter-template", "fdcpa-rights", "does-debt-validation-stop-collections"],
  "cease-and-desist-letter-debt-collectors": ["debt-validation-letter-template", "debt-collector-harassment", "fdcpa-rights"],
  "fdcpa-rights": ["11-words-to-stop-debt-collectors", "debt-collector-harassment", "can-debt-collectors-call-your-family"],
  "11-words-to-stop-debt-collectors": ["cease-and-desist-letter-debt-collectors", "fdcpa-rights", "777-rule-debt-collectors"],
  "777-rule-debt-collectors": ["debt-collector-harassment", "11-words-to-stop-debt-collectors", "fdcpa-rights"],
  "debt-collector-harassment": ["cease-and-desist-letter-debt-collectors", "can-debt-collectors-call-your-family", "fdcpa-rights"],
  "does-debt-validation-stop-collections": ["debt-validation-letter-template", "what-is-a-debt-validation-letter", "statute-of-limitations-on-debt"],
  "statute-of-limitations-on-debt": ["what-happens-if-you-ignore-debt-collectors", "california-debt-collection-laws", "how-long-does-collections-stay-on-credit-report"],
  "what-happens-if-you-ignore-debt-collectors": ["statute-of-limitations-on-debt", "debt-collector-harassment", "does-debt-validation-stop-collections"],
  "can-debt-collectors-call-your-family": ["fdcpa-rights", "debt-collector-harassment", "cease-and-desist-letter-debt-collectors"],
  "how-long-does-collections-stay-on-credit-report": ["statute-of-limitations-on-debt", "does-debt-validation-stop-collections", "what-happens-if-you-ignore-debt-collectors"],
  "medical-debt-validation-letter": ["debt-validation-letter-template", "what-is-a-debt-validation-letter", "does-debt-validation-stop-collections"],
  "california-debt-collection-laws": ["fdcpa-rights", "statute-of-limitations-on-debt", "debt-collector-harassment"],
  "midland-credit-management": ["portfolio-recovery-associates", "lvnv-funding", "debt-validation-letter-template"],
  "portfolio-recovery-associates": ["midland-credit-management", "encore-capital-group", "debt-validation-letter-template"],
  "lvnv-funding": ["midland-credit-management", "encore-capital-group", "debt-validation-letter-template"],
  "encore-capital-group": ["midland-credit-management", "portfolio-recovery-associates", "debt-validation-letter-template"],
  "ic-system": ["cbe-group", "national-credit-systems", "debt-validation-letter-template"],
  "cbe-group": ["ic-system", "convergent-outsourcing", "debt-validation-letter-template"],
  "convergent-outsourcing": ["cbe-group", "national-credit-systems", "debt-validation-letter-template"],
  "national-credit-systems": ["ic-system", "convergent-outsourcing", "debt-validation-letter-template"],
  "cavalry-spv": ["jefferson-capital-systems", "cach-llc", "debt-validation-letter-template"],
  "jefferson-capital-systems": ["cavalry-spv", "unifin", "debt-validation-letter-template"],
  "unifin": ["jefferson-capital-systems", "cach-llc", "debt-validation-letter-template"],
  "cach-llc": ["cavalry-spv", "lvnv-funding", "debt-validation-letter-template"],
  "alorica": ["midland-credit-management", "ic-system", "debt-validation-letter-template"],
  "credit-corp-solutions": ["portfolio-recovery-associates", "lvnv-funding", "debt-validation-letter-template"],
  "receivables-performance-management": ["convergent-outsourcing", "national-credit-systems", "debt-validation-letter-template"],
};

export default function RelatedArticles({ currentSlug }: { currentSlug: string }) {
  const relatedSlugs = RELATED_MAP[currentSlug] || [];
  const related = relatedSlugs
    .map((slug) => ALL_ARTICLES.find((a) => a.slug === slug))
    .filter(Boolean) as Article[];

  if (related.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="font-mono text-accent text-xs tracking-widest mb-4">
        RELATED RESOURCES
      </div>
      <div className="grid gap-3">
        {related.map((article) => (
          <Link
            key={article.slug}
            href={`/${article.slug}`}
            className="block p-4 border border-border bg-surface hover:border-accent/50 transition-colors"
          >
            <span className="text-foreground text-sm font-medium hover:text-accent transition-colors">
              {article.title} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
