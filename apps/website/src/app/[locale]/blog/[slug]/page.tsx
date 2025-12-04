import { Container } from '@/components/landing/container';
import { Footer, Navbar } from '@/components/landing/sections';
import {
  ArticleStructuredData,
  BreadcrumbListStructuredData,
  WebPageStructuredData,
} from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { getAllPosts, getPostBySlug } from '@/content/blog';
import { m } from '@/paraglide/messages';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../../../metadata';

/* eslint-disable react-refresh/only-export-components */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const title =
    locale === 'fr' ? post.metadata.title.fr : post.metadata.title.en;
  const description =
    locale === 'fr'
      ? post.metadata.description.fr
      : post.metadata.description.en;

  const metadata = generatePageMetadata({ locale });
  const postUrl = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog/${slug}`;

  return {
    ...metadata,
    title,
    description,
    openGraph: {
      ...metadata.openGraph,
      title,
      description,
      url: postUrl,
      type: 'article',
      publishedTime: post.metadata.publishedAt,
      modifiedTime: post.metadata.updatedAt,
      authors: [post.metadata.author.name],
      tags: post.metadata.tags,
    },
    twitter: {
      ...metadata.twitter,
      title,
      description,
    },
    alternates: {
      canonical: postUrl,
      languages: {
        en: `${SITE_URL}/blog/${slug}`,
        fr: `${SITE_URL}/fr/blog/${slug}`,
        'x-default': `${SITE_URL}/blog/${slug}`,
      },
    },
  };
}
/* eslint-enable react-refresh/only-export-components */

export async function generateStaticParams() {
  const posts = getAllPosts();
  const params: Array<{ locale: string; slug: string }> = [];

  for (const post of posts) {
    params.push({ locale: 'en', slug: post.metadata.slug });
    params.push({ locale: 'fr', slug: post.metadata.slug });
  }

  return params;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const title =
    locale === 'fr' ? post.metadata.title.fr : post.metadata.title.en;
  const description =
    locale === 'fr'
      ? post.metadata.description.fr
      : post.metadata.description.en;

  const postUrl = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog/${slug}`;
  const blogUrl = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog`;

  const publishedDate = new Date(post.metadata.publishedAt).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  const updatedDate = post.metadata.updatedAt
    ? new Date(post.metadata.updatedAt).toLocaleDateString(
        locale === 'fr' ? 'fr-FR' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )
    : null;

  // Get related posts (excluding current post)
  const relatedPosts = getAllPosts()
    .filter((p) => p.metadata.slug !== slug)
    .slice(0, 3);

  return (
    <>
      <WebPageStructuredData
        title={title}
        description={description}
        url={postUrl}
      />
      <ArticleStructuredData
        title={title}
        description={description}
        url={postUrl}
        publishedAt={post.metadata.publishedAt}
        updatedAt={post.metadata.updatedAt}
        author={post.metadata.author}
        image={post.metadata.image}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: locale === 'fr' ? 'Accueil' : 'Home', url: SITE_URL },
          { name: m.blog_title(), url: blogUrl },
          { name: title, url: postUrl },
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href={`/${locale}/blog`}
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {m.blog_back_to_blog()}
            </Link>

            <article>
              <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 text-xl text-muted-foreground">
                  {description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.metadata.publishedAt}>
                      {m.blog_published_on()} {publishedDate}
                    </time>
                  </div>
                  {updatedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.metadata.updatedAt!}>
                        {m.blog_updated_on()} {updatedDate}
                      </time>
                    </div>
                  )}
                  {post.metadata.readingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {m.blog_read_time({
                          minutes: post.metadata.readingTime,
                        })}
                      </span>
                    </div>
                  )}
                  {post.metadata.author && (
                    <span>
                      {m.blog_by_author({
                        author: post.metadata.author.name,
                      })}
                    </span>
                  )}
                </div>
                {post.metadata.tags && post.metadata.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {locale === 'fr' ? <post.ContentFr /> : <post.ContentEn />}
              </div>
            </article>

            {relatedPosts.length > 0 && (
              <aside className="mt-16 border-t pt-12">
                <h2 className="text-2xl font-bold mb-6">
                  {m.blog_related_articles()}
                </h2>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => {
                    const relatedTitle =
                      locale === 'fr'
                        ? relatedPost.metadata.title.fr
                        : relatedPost.metadata.title.en;
                    const relatedExcerpt =
                      locale === 'fr'
                        ? relatedPost.metadata.excerpt.fr
                        : relatedPost.metadata.excerpt.en;

                    return (
                      <Link
                        key={relatedPost.metadata.slug}
                        href={`/${locale}/blog/${relatedPost.metadata.slug}`}
                        className="block rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <h3 className="font-semibold text-lg">
                          {relatedTitle}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {relatedExcerpt}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
        </Container>
        </div>
        <Footer />
      </div>
    </>
  );
}
