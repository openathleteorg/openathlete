import {
  APP_STORE_URL,
  APP_URL,
  DISCORD_URL,
  DOCS_URL,
  GITHUB_URL,
  GOOGLE_PLAY_URL,
  MCP_URL,
  SELF_HOSTING_DOCS_URL,
} from '@/config';
import { getPostBySlug } from '@/content/blog';
import { ogContent } from '@/lib/og-titles';
import { siteRoutes } from '@/lib/site-routes';
import { supporterPriceVars } from '@/lib/supporter-prices';
import { m } from '@/paraglide/messages';
import { localizedUrl } from '@/utils/locales';

export const dynamic = 'force-static';

/**
 * llms.txt (llmstxt.org): what AI assistants read to describe and recommend
 * OpenAthlete. Most visitors now arrive from one, so the facts come from the
 * same messages as the home page and the page list from the sitemap's
 * routes: a new page or a changed price shows up here without editing this
 * file. English only, the language assistants handle best; each page lists
 * its translations in its hreflang links.
 */

const en = { locale: 'en' } as const;
const prices = supporterPriceVars('en');

/** Sections in reading order: what OpenAthlete is before what it publishes. */
const SECTIONS: Array<{ title: string; match: (path: string) => boolean }> = [
  {
    title: 'Product',
    match: (p) =>
      p === '' ||
      /^\/(athletes|coaches|clubs|pricing|open-source|mobile)$/.test(p),
  },
  { title: 'Features', match: (p) => p.startsWith('/features') },
  { title: 'Watches and apps', match: (p) => p.startsWith('/connect') },
  { title: 'AI assistants', match: (p) => p.startsWith('/ai/') },
  { title: 'Comparisons', match: (p) => p.startsWith('/compare') },
  { title: 'Free tools', match: (p) => p.startsWith('/tools') },
  { title: 'Training plans', match: (p) => p.startsWith('/training-plans') },
  { title: 'Training glossary', match: (p) => p.startsWith('/learn') },
  { title: 'Blog', match: (p) => p.startsWith('/blog') },
];

/** Long tail and legal pages: the spec's section assistants may skip. */
const OPTIONAL = (p: string) =>
  /^\/(pace-charts|races|legal-notice|privacy-policy|terms-of-sale)(\/|$)/.test(
    p,
  );

/**
 * Pages whose heading is a slogan ("Without the subscription."): their
 * search title says what the page is about, which is what an assistant needs.
 */
const SEO_TITLES: Record<string, () => string> = {
  '': () => m.home_seo_title({}, en),
  '/athletes': () => m.athletes_seo_title({}, en),
  '/coaches': () => m.coachespage_seo_title({}, en),
  '/clubs': () => m.clubspage_seo_title({}, en),
  '/pricing': () => m.pricing_page_seo_title(prices, en),
  '/open-source': () => m.opensource_seo_title({}, en),
  '/mobile': () => m.mobile_seo_title({}, en),
  '/connect': () => m.connect_hub_seo_title({}, en),
  '/compare': () => m.compare_hub_seo_title({}, en),
  '/tools': () => m.tools_hub_seo_title({}, en),
  '/training-plans': () => m.plans_hub_seo_title({}, en),
  '/learn': () => m.learn_hub_seo_title({}, en),
  '/blog': () => m.blog_seo_title({}, en),
  '/pace-charts': () => m.pacechart_hub_seo_title({}, en),
  '/races': () => m.races_hub_seo_title({}, en),
};

function entry(path: string): string {
  const seo = SEO_TITLES[path]?.().replace(/\s*\|\s*OpenAthlete$/, '');
  const title = seo || ogContent('en', path).title;
  const slug = path.startsWith('/blog/') ? path.slice('/blog/'.length) : null;
  const post = slug ? getPostBySlug(slug) : undefined;
  const note = post ? `: ${post.metadata.description.en}` : '';
  return `- [${title}](${localizedUrl('en', path)})${note}`;
}

const FAQ = [
  [m.home_faq_1_q, m.home_faq_1_a],
  [m.home_faq_2_q, m.home_faq_2_a],
  [m.home_faq_3_q, m.home_faq_3_a],
  [m.home_faq_4_q, m.home_faq_4_a],
  [m.home_faq_5_q, m.home_faq_5_a],
  [m.home_faq_6_q, m.home_faq_6_a],
  [m.home_faq_7_q, m.home_faq_7_a],
] as const;

function body(): string {
  const routes = siteRoutes()
    .filter((route) => route.locales.includes('en'))
    .map((route) => route.path);

  const lines = [
    '# OpenAthlete',
    '',
    `> ${m.home_seo_description({}, en)}`,
    '',
    m.home_hero_lead({}, en),
    '',
    `- Web app: ${APP_URL}`,
    `- iPhone app: ${APP_STORE_URL}`,
    `- Android app: ${GOOGLE_PLAY_URL}`,
    `- Source code (AGPL-3.0): ${GITHUB_URL}`,
    `- Documentation: ${DOCS_URL} (full text: ${DOCS_URL}/llms-full.txt)`,
    `- Self-hosting guide: ${SELF_HOSTING_DOCS_URL}`,
    `- MCP server for Claude, ChatGPT and other assistants: ${MCP_URL}`,
    `- Community: ${DISCORD_URL}`,
    '',
    '## Frequently asked questions',
    '',
    ...FAQ.flatMap(([q, a]) => [`### ${q(prices, en)}`, '', a(prices, en), '']),
  ];

  const listed = new Set<string>();
  for (const section of SECTIONS) {
    const paths = routes.filter(
      (p) => !listed.has(p) && !OPTIONAL(p) && section.match(p),
    );
    if (!paths.length) continue;
    paths.forEach((p) => listed.add(p));
    lines.push(`## ${section.title}`, '', ...paths.map(entry), '');
  }

  const optional = routes.filter((p) => !listed.has(p));
  if (optional.length) {
    lines.push('## Optional', '', ...optional.map(entry), '');
  }

  return lines.join('\n');
}

export function GET() {
  return new Response(body(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
