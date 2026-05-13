import ArticleSchema from "./ArticleSchema";
import BreadcrumbSchema from "./BreadcrumbSchema";
import RelatedArticles from "./RelatedArticles";
import Link from "next/link";

interface ContentWrapperProps {
  slug: string;
  title: string;
  description: string;
  datePublished?: string;
  children: React.ReactNode;
}

export default function ContentWrapper({
  slug,
  title,
  description,
  datePublished = "2025-03-01",
  children,
}: ContentWrapperProps) {
  return (
    <>
      <ArticleSchema
        title={title}
        description={description}
        slug={slug}
        datePublished={datePublished}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://debtstrike.io" },
          { name: "Resources", url: "https://debtstrike.io/resources" },
          { name: title, url: `https://debtstrike.io/${slug}` },
        ]}
      />
      {/* Visual breadcrumb */}
      <nav className="mb-6 text-xs text-muted font-mono tracking-wider">
        <Link href="/" className="hover:text-accent transition-colors">
          HOME
        </Link>
        <span className="mx-2">/</span>
        <Link href="/resources" className="hover:text-accent transition-colors">
          RESOURCES
        </Link>
        <span className="mx-2">/</span>
        <span className="text-accent">{title.toUpperCase().slice(0, 50)}{title.length > 50 ? "..." : ""}</span>
      </nav>

      {children}

      <RelatedArticles currentSlug={slug} />
    </>
  );
}
