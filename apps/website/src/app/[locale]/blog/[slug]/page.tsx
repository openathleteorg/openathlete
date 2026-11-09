import { PostCard } from '@/components/blog/post-card';
import { proseStyles } from '@/components/blog/prose';
import {
  BlogPostingStructuredData,
  BreadcrumbListStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Container } from '@/components/site/layout-primitives';
import { TrackedLink } from '@/components/site/tracked-link';
import {
  getAllPosts,
  getPostBySlug,
  getPostContent,
  getPostLocales,
  getPostText,
} from '@/content/blog';
import type { BlogPost } from '@/content/blog/types';
import { SUPPORTED_LOCALES, initLocale } from '@/i18n/server';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  DEFAULT_LOCALE,
  formatLongDate,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string; slug: string }> };

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    getAllPosts().map((post) => ({ locale, slug: post.metadata.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = initLocale(raw);
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const title = getPostText(post.metadata.title, locale);
  const postLocales = getPostLocales(post);
  const metadata = pageMetadata({
    locale,
    path: `/blog/${slug}`,
    title,
    description: getPostText(post.metadata.description, locale),
    // Untranslated posts show the English body: hreflang lists only the
    // languages the post is really written in
    locales: postLocales,
    image: post.metadata.image,
    type: 'article',
  });
  return {
    ...metadata,
    // The English fallback of an untranslated post would duplicate it
    ...(!postLocales.includes(locale) && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: post.metadata.publishedAt,
      modifiedTime: post.metadata.updatedAt ?? post.metadata.publishedAt,
      authors: [post.metadata.author.name],
      tags: post.metadata.tags,
    },
  };
}
/* eslint-enable react-refresh/only-export-components */

/** Posts sharing the most tags with this one, newest first on a tie. */
function relatedPosts(post: BlogPost, count = 3): BlogPost[] {
  const tags = new Set(post.metadata.tags?.map((tag) => tag.toLowerCase()));
  return getAllPosts()
    .filter((other) => other.metadata.slug !== post.metadata.slug)
    .map((other, index) => ({
      other,
      index,
      score:
        other.metadata.tags?.filter((tag) => tags.has(tag.toLowerCase()))
          .length ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map(({ other }) => other);
}

export default async function BlogPostPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = initLocale(raw);
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { metadata } = post;
  const title = getPostText(metadata.title, locale);
  const description = getPostText(metadata.description, locale);
  const Translated = getPostContent(post, locale);
  const Body = Translated ?? post.ContentEn;
  const bodyLocale = Translated ? locale : DEFAULT_LOCALE;
  const url = localizedUrl(locale, `/blog/${slug}`);
  const updated =
    metadata.updatedAt && metadata.updatedAt !== metadata.publishedAt
      ? metadata.updatedAt
      : undefined;
  const placement = 'blog_post_aside';

  return (
    <>
      <BlogPostingStructuredData
        title={title}
        description={description}
        url={url}
        image={metadata.image}
        publishedAt={metadata.publishedAt}
        updatedAt={metadata.updatedAt}
        authorName={metadata.author.name}
        inLanguage={bodyLocale}
        keywords={metadata.tags}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.blog_kicker(), url: localizedUrl(locale, '/blog') },
          { name: title, url },
        ]}
      />

      <article>
        <header className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_80%)] opacity-60" />
          <Container size="narrow" className="relative">
            <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href={localePath(locale, '/blog')}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 font-medium text-ink transition-colors hover:border-ink/25"
              >
                <ArrowLeft className="size-3.5" />
                {m.blog_kicker()}
              </Link>
            </nav>
            <h1 className="text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.04] font-semibold tracking-[-0.04em] text-ink">
              {title}
            </h1>
            <p className="lead mt-6">{getPostText(metadata.excerpt, locale)}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6 text-sm">
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-ink">
                  <Image
                    src="/logo-mark-white.svg"
                    alt=""
                    width={22}
                    height={16}
                    unoptimized
                  />
                </span>
                <span className="leading-tight">
                  <span className="block font-medium text-ink">
                    {metadata.author.name}
                  </span>
                  <time
                    dateTime={metadata.publishedAt}
                    className="text-muted-foreground"
                  >
                    {formatLongDate(metadata.publishedAt, locale)}
                  </time>
                </span>
              </span>
              {metadata.readingTime && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" />
                  {m.blog_read_minutes({ minutes: metadata.readingTime })}
                </span>
              )}
              {updated && (
                <time dateTime={updated} className="text-muted-foreground">
                  {m.blog_updated({ date: formatLongDate(updated, locale) })}
                </time>
              )}
            </div>
          </Container>
        </header>

        {metadata.image && (
          <Container className="max-w-[64rem]">
            <div className="relative aspect-[16/8] overflow-hidden rounded-[1.5rem] bg-paper shadow-[0_30px_60px_-40px_rgb(5_12_52/0.45)]">
              <Image
                src={metadata.image}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 1000px, 100vw"
                className="object-cover"
              />
            </div>
          </Container>
        )}

        <Container className="max-w-[64rem]">
          <div className="grid gap-12 pt-12 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
            <div className="min-w-0">
              {bodyLocale !== locale && (
                <p className="mb-10 rounded-xl border border-sky/40 bg-sky/10 px-4 py-3 text-[0.92rem] text-ink">
                  {m.blog_fallback_notice()}
                </p>
              )}
              <div
                className={proseStyles}
                lang={bodyLocale !== locale ? htmlLang(bodyLocale) : undefined}
              >
                <Body />
              </div>

              <footer className="mt-16 flex gap-5 rounded-2xl border border-border bg-paper p-6 sm:p-7">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink">
                  <Image
                    src="/logo-mark-white.svg"
                    alt=""
                    width={26}
                    height={19}
                    unoptimized
                  />
                </span>
                <div>
                  <p className="kicker text-muted-foreground">
                    {m.blog_written_by()}
                  </p>
                  <p className="mt-1 font-semibold text-ink">
                    {metadata.author.name}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                    {m.blog_author_bio()}
                  </p>
                </div>
              </footer>
            </div>

            <aside className="lg:pt-1">
              <div className="ink-band relative overflow-hidden rounded-2xl p-6 lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
                <div className="dot-grid absolute inset-0 opacity-50" />
                <div className="relative">
                  <p className="text-[1.1rem] leading-snug font-semibold text-white">
                    {m.blog_aside_title()}
                  </p>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-soft">
                    {m.blog_aside_body()}
                  </p>
                  <TrackedLink
                    href={signupUrl(placement)}
                    event="cta_clicked"
                    properties={{ placement, cta: 'signup' }}
                    className={buttonStyles({
                      variant: 'light',
                      size: 'sm',
                      className: 'mt-5 w-full',
                    })}
                  >
                    {m.blog_aside_cta()}
                    <ArrowRight />
                  </TrackedLink>
                  <Link
                    href={localePath(locale, '/features')}
                    className="mt-3 block text-center text-[0.85rem] text-ink-soft underline-offset-4 hover:text-white hover:underline"
                  >
                    {m.blog_aside_more()}
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </article>

      <section className="border-t border-border bg-paper py-16 sm:py-20">
        <Container>
          <h2 className="display-3 mb-8 text-ink">{m.blog_keep_reading()}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts(post).map((other) => (
              <PostCard
                key={other.metadata.slug}
                post={other}
                locale={locale}
              />
            ))}
          </div>
        </Container>
      </section>

      <div className="bg-paper">
        <CtaBand
          locale={locale}
          placement="blog_post_final"
          title={m.blog_final_title()}
          body={m.blog_final_body()}
        />
      </div>
    </>
  );
}
