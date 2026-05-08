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
  const fullTitle = path === '/' ? title : `${title} | ${siteName}`;

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
    "author": {
      "@type": "Organization",
      "name": "FileNinja"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": "Free, Private, No Upload, Offline Support, Client-side Processing"
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
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#121212" />
      <meta name="author" content="FileNinja" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://file-ninja.vercel.app/og-image.png" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://file-ninja.vercel.app/og-image.png" />
      <meta name="twitter:site" content="@FileNinja" />

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
