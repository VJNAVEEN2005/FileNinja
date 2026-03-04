import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO component for dynamic metadata and JSON-LD schema.
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description
 * @param {string} props.path - Canonical path (e.g., '/merge-pdf')
 * @param {Object} props.schema - Optional JSON-LD schema object
 * @param {Array} props.faq - Optional array of FAQ objects { question, answer }
 */
export default function SEO({ title, description, path, schema, faq }) {
  const url = `https://file-ninja.vercel.app${path}`;
  const siteName = 'FileNinja';
  const fullTitle = `${title} | ${siteName}`;

  // Default WebApplication schema
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": title,
    "url": url,
    "description": description,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": "Free, Private, No Upload, Offline Support"
  };

  // FAQ Schema if provided
  const faqSchema = faq ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://file-ninja.vercel.app/og-image.png" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content="https://file-ninja.vercel.app/og-image.png" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}
    </Helmet>
  );
}
