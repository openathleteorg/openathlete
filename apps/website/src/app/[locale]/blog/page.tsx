import { postHref } from '@/components/blog/links';
import { FeaturedPost, PostCard } from '@/components/blog/post-card';
import {
  BreadcrumbListStructuredData,
  ItemListStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container } from '@/components/site/layout-primitives';
import { RevealGroup, RevealItem } from '@/components/site/reveal';
import { SITE_URL } from '@/config';
import { getAllPosts, getPostText } from '@/content/blog';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localizedUrl } from '@/utils/locales';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/blog',
    title: m.blog_seo_title(),
    description: m.blog_seo_description(),
  });
}

export default async function BlogPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const [latest, ...rest] = getAllPosts();

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.blog_kicker(), url: localizedUrl(locale, '/blog') },
        ]}
      />
      <ItemListStructuredData
        name={m.blog_h1()}
        items={getAllPosts().map((post) => ({
          name: getPostText(post.metadata.title, locale),
          url: `${SITE_URL}${postHref(locale, post)}`,
        }))}
      />

      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <div className="max-w-3xl">
            <p className="kicker mb-5 text-muted-foreground">
              {m.blog_kicker()}
            </p>
            <h1 className="display-1 text-ink">{m.blog_h1()}</h1>
            <p className="lead mt-6 max-w-2xl">{m.blog_lead()}</p>
          </div>
        </Container>
      </section>

      {latest ? (
        <>
          <section className="pb-16 sm:pb-20">
            <Container>
              <FeaturedPost post={latest} locale={locale} />
            </Container>
          </section>

          {rest.length > 0 && (
            <section className="border-t border-border bg-paper py-16 sm:py-24">
              <Container>
                <div className="mb-10 flex items-end justify-between gap-6">
                  <h2 className="display-3 text-ink">
                    {m.blog_all_articles()}
                  </h2>
                  <p className="kicker text-muted-foreground">
                    {m.blog_count({ count: String(rest.length + 1) })}
                  </p>
                </div>
                <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <RevealItem key={post.metadata.slug} className="h-full">
                      <PostCard post={post} locale={locale} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              </Container>
            </section>
          )}
        </>
      ) : (
        <Container className="pb-24">
          <p className="text-muted-foreground">{m.blog_empty()}</p>
        </Container>
      )}

      <div className="bg-paper pt-4">
        <CtaBand
          locale={locale}
          placement="blog_index_final"
          title={m.blog_final_title()}
          body={m.blog_final_body()}
        />
      </div>
    </>
  );
}
