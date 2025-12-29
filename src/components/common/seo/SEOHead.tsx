import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const BASE_URL = 'https://forcemajeure.live';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'Force Majeure';

export const SEOHead = ({
  title,
  description = "Austin's premier electronic music events and ticketing platform. Experience unforgettable nights with world-class DJs.",
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Austin's Premier EDM Events`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};
