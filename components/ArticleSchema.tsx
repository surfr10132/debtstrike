interface ArticleSchemaProps {
  title: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
}

export default function ArticleSchema({
  title,
  description,
  slug,
  datePublished = "2025-03-01",
  dateModified,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `https://debtstrike.io/${slug}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: "DebtStrike.io",
      url: "https://debtstrike.io",
    },
    publisher: {
      "@type": "Organization",
      name: "DebtStrike.io",
      url: "https://debtstrike.io",
      logo: {
        "@type": "ImageObject",
        url: "https://debtstrike.io/og-image.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://debtstrike.io/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
