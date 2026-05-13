import Link from "next/link";

export const metadata = {
  title: "Debt Collection Resources & Legal Guides | DebtStrike.io",
  description: "Complete guides to FDCPA rights, debt validation letters, and fighting debt collectors. 16 comprehensive resources to help you take control.",
};

interface ResourceItem {
  slug: string;
  title: string;
  description: string;
}

const resourcesByCategory: Record<string, { title: string; resources: ResourceItem[] }> = {
  "know-your-rights": {
    title: "Know Your Rights",
    resources: [
      {
        slug: "fdcpa-rights",
        title: "Your FDCPA Rights Explained",
        description: "A complete guide to your rights under the Fair Debt Collection Practices Act.",
      },
      {
        slug: "statute-of-limitations-on-debt",
        title: "Statute of Limitations on Debt by State",
        description: "Know when a debt becomes uncollectible based on state law.",
      },
      {
        slug: "california-debt-collection-laws",
        title: "California Debt Collection Laws (RFDCPA)",
        description: "California-specific protections under the Rosenthal Fair Debt Collection Practices Act.",
      },
    ],
  },
  "letter-templates": {
    title: "Letter Templates & Guides",
    resources: [
      {
        slug: "debt-validation-letter-template",
        title: "Debt Validation Letter Template",
        description: "Get a ready-to-use template for demanding proof of your debt from collectors.",
      },
      {
        slug: "cease-and-desist-letter-debt-collectors",
        title: "Cease and Desist Letter for Debt Collectors",
        description: "Stop collector calls and harassment with a legal cease and desist notice.",
      },
      {
        slug: "what-is-a-debt-validation-letter",
        title: "What Is a Debt Validation Letter?",
        description: "Understand how debt validation works and why it's your strongest tool.",
      },
      {
        slug: "medical-debt-validation-letter",
        title: "Medical Debt Validation Letter",
        description: "Specialized guidance for handling medical debt collection.",
      },
    ],
  },
  "collector-tactics": {
    title: "Collector Tactics & Defense",
    resources: [
      {
        slug: "11-words-to-stop-debt-collectors",
        title: "The 11 Words to Stop Debt Collectors",
        description: "The powerful phrase that legally forces collectors to stop calling.",
      },
      {
        slug: "777-rule-debt-collectors",
        title: "The 7-7-7 Rule for Debt Collectors",
        description: "The critical timeline debt collectors must follow under federal law.",
      },
      {
        slug: "debt-collector-harassment",
        title: "Debt Collector Harassment: What's Illegal",
        description: "Learn what collector tactics are illegal and how to document violations.",
      },
      {
        slug: "can-debt-collectors-call-your-family",
        title: "Can Debt Collectors Call Your Family?",
        description: "Your rights to privacy and how to stop family harassment.",
      },
      {
        slug: "what-happens-if-you-ignore-debt-collectors",
        title: "What Happens If You Ignore Debt Collectors?",
        description: "Understand the consequences and your options when ignoring collection calls.",
      },
      {
        slug: "does-debt-validation-stop-collections",
        title: "Does Debt Validation Stop Collections?",
        description: "Understand the legal power and limitations of debt validation.",
      },
    ],
  },
  "specific-collectors": {
    title: "Specific Collectors",
    resources: [
      {
        slug: "midland-credit-management",
        title: "Midland Credit Management: Know Your Rights",
        description: "Learn how to challenge Midland Credit Management and understand your consumer rights.",
      },
      {
        slug: "portfolio-recovery-associates",
        title: "Portfolio Recovery Associates: How to Fight Back",
        description: "Strategies and legal protections for dealing with Portfolio Recovery Associates.",
      },
    ],
  },
  "credit-timelines": {
    title: "Credit & Timelines",
    resources: [
      {
        slug: "how-long-does-collections-stay-on-credit-report",
        title: "How Long Does a Collection Stay on Your Credit Report?",
        description: "Timeline for collection removal and credit report recovery.",
      },
    ],
  },
};

const ResourceCard = ({ resource }: { resource: ResourceItem }) => (
  <Link
    href={`/${resource.slug}`}
    className="group border border-border bg-surface hover:bg-surface-light p-6 transition-all duration-200 hover:border-accent"
  >
    <h3 className="font-bold text-lg mb-2 group-hover:text-accent transition-colors">
      {resource.title}
    </h3>
    <p className="text-muted text-sm leading-relaxed">
      {resource.description}
    </p>
    <div className="mt-4 flex items-center text-accent text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">
      Read More →
    </div>
  </Link>
);

export default function ResourcesPage() {
  const categoryOrder = ["know-your-rights", "letter-templates", "collector-tactics", "specific-collectors", "credit-timelines"];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-mono text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-accent">RESOURCES</span> & <span className="text-accent">GUIDES</span>
        </h1>
        <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto">
          Everything you need to know about your rights against debt collectors, debt validation, and fighting back against harassment.
        </p>
      </div>

      {/* Resources by Category */}
      <div className="space-y-12">
        {categoryOrder.map((categoryKey) => {
          const category = resourcesByCategory[categoryKey];
          return (
            <div key={categoryKey} className="space-y-4">
              <h2 className="font-mono text-accent text-lg tracking-widest uppercase">
                {category.title}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {category.resources.map((resource) => (
                  <ResourceCard key={resource.slug} resource={resource} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="mt-12 p-8 border border-accent/30 bg-accent/5 text-center space-y-4">
        <p className="font-mono text-accent text-sm tracking-widest uppercase">
          // Ready to take action?
        </p>
        <h2 className="text-2xl font-bold">
          Generate Your Debt Validation & Cease and Desist Letter
        </h2>
        <p className="text-muted max-w-xl mx-auto">
          Use the information from these guides to generate a powerful, legally-referenced letter in 60 seconds.
        </p>
        <Link href="/generate" className="btn-tactical px-10 py-3 inline-block mt-4">
          Launch Your Strike — $20
        </Link>
      </div>
    </div>
  );
}
