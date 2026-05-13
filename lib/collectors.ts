/**
 * Collector data for dynamic /go/[collector-slug] landing pages.
 * Each collector gets a personalized landing page for Google Ads.
 */

export interface CollectorData {
  slug: string;
  name: string;
  /** Short name for headlines — e.g., "Midland" instead of "Midland Credit Management" */
  shortName: string;
  /** One-sentence description of who they are */
  description: string;
  /** 2-3 common complaints consumers have about this collector */
  complaints: string[];
  /** Key fact or stat about this collector */
  keyFact: string;
  /** The slug for the existing content page (for "Learn more" link) */
  contentPageSlug: string;
}

export const COLLECTORS: CollectorData[] = [
  {
    slug: "midland-credit-management",
    name: "Midland Credit Management",
    shortName: "Midland",
    description:
      "One of the largest debt buyers in the U.S. They purchase old debts for pennies on the dollar and try to collect the full amount.",
    complaints: [
      "Calling about debts you don't recognize",
      "Reporting inaccurate balances to credit bureaus",
      "Attempting to collect on time-barred debts",
    ],
    keyFact: "Subsidiary of Encore Capital Group — they buy debt portfolios in bulk",
    contentPageSlug: "midland-credit-management",
  },
  {
    slug: "portfolio-recovery-associates",
    name: "Portfolio Recovery Associates",
    shortName: "PRA",
    description:
      "A major debt buyer that purchases charged-off consumer debts from banks and credit card companies.",
    complaints: [
      "Aggressive collection calls at all hours",
      "Threatening lawsuits over small balances",
      "Failing to validate debts when asked",
    ],
    keyFact: "One of the most-complained-about collectors on the CFPB database",
    contentPageSlug: "portfolio-recovery-associates",
  },
  {
    slug: "lvnv-funding",
    name: "LVNV Funding",
    shortName: "LVNV",
    description:
      "A debt buyer that purchases portfolios of defaulted debts and uses third-party agencies to collect.",
    complaints: [
      "Collecting on debts past the statute of limitations",
      "Inaccurate account information on credit reports",
      "No documentation of original debt agreement",
    ],
    keyFact: "Often works with Resurgent Capital Services to collect debts",
    contentPageSlug: "lvnv-funding",
  },
  {
    slug: "encore-capital-group",
    name: "Encore Capital Group",
    shortName: "Encore",
    description:
      "The parent company of Midland Credit Management and one of the largest debt buyers in the world.",
    complaints: [
      "Pursuing debts with incomplete records",
      "Reporting the same debt under multiple names",
      "Continuing to call after cease-and-desist requests",
    ],
    keyFact: "Publicly traded company that has faced multiple CFPB enforcement actions",
    contentPageSlug: "encore-capital-group",
  },
  {
    slug: "ic-system",
    name: "IC System",
    shortName: "IC System",
    description:
      "A third-party collection agency that collects debts on behalf of original creditors like hospitals, utilities, and telecoms.",
    complaints: [
      "Collecting medical debts you thought were covered by insurance",
      "Reporting debts without prior notice",
      "Refusing to provide itemized statements",
    ],
    keyFact: "Frequently collects medical and utility debts",
    contentPageSlug: "ic-system",
  },
  {
    slug: "convergent-outsourcing",
    name: "Convergent Outsourcing",
    shortName: "Convergent",
    description:
      "A collection agency that works with telecom companies, cable providers, and utility companies.",
    complaints: [
      "Collecting cable and phone bills you already paid",
      "Adding fees and interest to the original balance",
      "Reporting debts without sending a validation notice first",
    ],
    keyFact: "Commonly collects for AT&T, DirecTV, and other telecom companies",
    contentPageSlug: "convergent-outsourcing",
  },
  {
    slug: "national-credit-systems",
    name: "National Credit Systems",
    shortName: "NCS",
    description:
      "A collection agency that primarily collects apartment and rental-related debts.",
    complaints: [
      "Collecting disputed apartment damages or cleaning fees",
      "Inflating move-out charges beyond the security deposit",
      "Reporting rental debts without proof of the charges",
    ],
    keyFact: "Specializes in apartment and property management collections",
    contentPageSlug: "national-credit-systems",
  },
  {
    slug: "jefferson-capital-systems",
    name: "Jefferson Capital Systems",
    shortName: "Jefferson Capital",
    description:
      "A debt buyer that purchases and collects on consumer debts including credit cards, telecom, and retail accounts.",
    complaints: [
      "Collecting on debts you don't recognize from unknown original creditors",
      "Continuing to report after disputes",
      "Lack of documentation proving ownership of the debt",
    ],
    keyFact: "Purchases debt portfolios from banks, telecom, and retail companies",
    contentPageSlug: "jefferson-capital-systems",
  },
  {
    slug: "enhanced-recovery-company",
    name: "Enhanced Recovery Company",
    shortName: "ERC",
    description:
      "One of the largest third-party collection agencies in the U.S., collecting debts for telecom, cable, and financial services companies.",
    complaints: [
      "Relentless automated calls and robocalls",
      "Collecting debts consumers say they don't owe",
      "Failing to properly validate disputed debts",
    ],
    keyFact: "Consistently ranks in the top 5 most-complained-about collectors on the CFPB database",
    contentPageSlug: "enhanced-recovery-company",
  },
  {
    slug: "alorica",
    name: "Alorica",
    shortName: "Alorica",
    description:
      "Formerly Expert Global Solutions — a massive outsourcing company that handles debt collection calls for banks, telecoms, and other creditors.",
    complaints: [
      "High-volume automated dialing campaigns",
      "Agents who can't explain basic details about the debt",
      "Difficulty getting disputes acknowledged or processed",
    ],
    keyFact: "Most-complained-about debt collector in 5 states according to CFPB data",
    contentPageSlug: "alorica",
  },
  {
    slug: "credit-corp-solutions",
    name: "Credit Corp Solutions",
    shortName: "Credit Corp",
    description:
      "An Australian-based debt buyer that expanded into the U.S. market, purchasing and collecting consumer debts.",
    complaints: [
      "Collecting on very old debts near or past the statute of limitations",
      "Offering lowball settlements without explaining rights",
      "Continuing to call after requests to stop",
    ],
    keyFact: "Headquartered in Australia, one of the newer entrants to the U.S. debt-buying market",
    contentPageSlug: "credit-corp-solutions",
  },
  {
    slug: "transworld-systems",
    name: "Transworld Systems",
    shortName: "TSI",
    description:
      "A major collection agency that handles debts for healthcare, education, financial services, and government clients.",
    complaints: [
      "Collecting medical and student loan debts consumers dispute",
      "Reporting debts to credit bureaus without proper notice",
      "Continuing collection activity after receiving written disputes",
    ],
    keyFact: "Subject of CFPB enforcement action for deceptive debt collection practices",
    contentPageSlug: "transworld-systems",
  },
];

/** Look up a collector by slug. Returns undefined if not found. */
export function getCollectorBySlug(slug: string): CollectorData | undefined {
  return COLLECTORS.find((c) => c.slug === slug);
}

/** Get all collector slugs for generateStaticParams. */
export function getAllCollectorSlugs(): string[] {
  return COLLECTORS.map((c) => c.slug);
}
