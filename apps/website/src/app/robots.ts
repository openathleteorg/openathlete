import { SITE_URL } from '@/config';
import type { MetadataRoute } from 'next';

/**
 * Most visitors now find OpenAthlete through an AI assistant, so their
 * crawlers are welcome by name: search indexing (OAI-SearchBot,
 * Claude-SearchBot, PerplexityBot), pages fetched while answering a user
 * (ChatGPT-User, Claude-User, Perplexity-User, MistralAI-User) and training
 * (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot), which is
 * how an assistant knows the project without searching. A crawler follows
 * only the most specific group that names it, so each group repeats the
 * disallow.
 */
const AI_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
  'PerplexityBot',
  'Perplexity-User',
  'MistralAI-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: ['/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
