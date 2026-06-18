/**
 * Organization JSON-LD Structured Data
 * Provides brand information for Google Knowledge Panel
 */
export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MyMedDevices',
    url: 'https://mymeddevices.com',
    logo: 'https://mymeddevices.com/logos/logo.png',
    description:
      "Kenya's most trusted online provider of home-based medical devices and equipment.",
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Swahili'],
    },
    sameAs: [
      // Add social media URLs when available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      suppressHydrationWarning
    />
  );
}

export default OrganizationJsonLd;
