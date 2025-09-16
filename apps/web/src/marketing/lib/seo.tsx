import { getLocale } from '@/paraglide/runtime';

interface MetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE_NAME = 'OpenAthlete';
const DEFAULT_DESC =
  'OpenAthlete – data-driven endurance coaching: race planning, nutrition strategy, structured training for trail & ultra athletes.';
const DEFAULT_IMAGE = '/og-default.png';

export function Seo({ title, description, image, url }: MetaProps) {
  const locale = getLocale();
  const fullTitle = title ? `${title} • ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      <link rel="canonical" href={url || window.location.href} />
    </>
  );
}
