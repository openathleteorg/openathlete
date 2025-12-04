import { Container } from '@/components/landing/container';
import { Footer, Navbar } from '@/components/landing/sections';
import { BreadcrumbListStructuredData } from '@/components/seo/structured-data';
import { WebPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { getAllPosts } from '@/content/blog';
import { m } from '@/paraglide/messages';
import { Calendar, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../../metadata';

/* eslint-disable react-refresh/only-export-components */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  const metadata = generatePageMetadata({ locale });
  return {
    ...metadata,
    title: m.blog_title(),
    description: m.blog_description(),
    alternates: {
      canonical: `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog`,
      languages: {
        en: `${SITE_URL}/blog`,
        fr: `${SITE_URL}/fr/blog`,
        'x-default': `${SITE_URL}/blog`,
      },
    },
  };
}
/* eslint-enable react-refresh/only-export-components */

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  const posts = getAllPosts();
  const blogUrl = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/blog`;

  return (
    <>
      <WebPageStructuredData
        title={m.blog_title()}
        description={m.blog_description()}
        url={blogUrl}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: locale === 'fr' ? 'Accueil' : 'Home', url: SITE_URL },
          { name: m.blog_title(), url: blogUrl },
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="py-12">
          <Container>
            <div className="mx-auto max-w-4xl">
              <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {m.blog_title()}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  {m.blog_description()}
                </p>
              </header>

              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {m.blog_no_articles()}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {posts.map((post) => {
                    const title =
                      locale === 'fr'
                        ? post.metadata.title.fr
                        : post.metadata.title.en;
                    const excerpt =
                      locale === 'fr'
                        ? post.metadata.excerpt.fr
                        : post.metadata.excerpt.en;
                    const publishedDate = new Date(
                      post.metadata.publishedAt,
                    ).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });

                    return (
                      <article
                        key={post.metadata.slug}
                        className="group rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <Link
                          href={`/${locale}/blog/${post.metadata.slug}`}
                          className="block"
                        >
                          <h2 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                            {title}
                          </h2>
                          <p className="mt-2 text-muted-foreground">
                            {excerpt}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <time dateTime={post.metadata.publishedAt}>
                                {publishedDate}
                              </time>
                            </div>
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
                          {post.metadata.tags &&
                            post.metadata.tags.length > 0 && (
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
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </Container>
        </div>
        <Footer />
      </div>
    </>
  );
}
