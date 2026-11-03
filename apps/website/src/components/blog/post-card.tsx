import { getPostText } from '@/content/blog';
import type { BlogPost } from '@/content/blog/types';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, formatLongDate } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { postHref } from './links';

/** Date and reading time, on one line. */
export function PostMeta({
  post,
  locale,
  className,
}: {
  post: BlogPost;
  locale: SupportedLocale;
  className?: string;
}) {
  const { publishedAt, readingTime } = post.metadata;
  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-2 text-[0.85rem] text-muted-foreground',
        className,
      )}
    >
      <time dateTime={publishedAt}>{formatLongDate(publishedAt, locale)}</time>
      {readingTime && (
        <>
          <span aria-hidden>·</span>
          <span>{m.blog_read_minutes({ minutes: readingTime })}</span>
        </>
      )}
    </p>
  );
}

/** A post in a grid: picture, first tag, title, excerpt. */
export function PostCard({
  post,
  locale,
  headingLevel: Heading = 'h3',
}: {
  post: BlogPost;
  locale: SupportedLocale;
  headingLevel?: 'h2' | 'h3';
}) {
  const title = getPostText(post.metadata.title, locale);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_18px_40px_-24px_rgb(5_12_52/0.35)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-paper">
        {post.metadata.image ? (
          <Image
            src={post.metadata.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="brand-gradient absolute inset-0 opacity-30" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <Heading className="text-[1.15rem] leading-snug font-semibold tracking-[-0.015em] text-ink">
          <Link
            href={postHref(locale, post)}
            className="after:absolute after:inset-0"
          >
            {title}
          </Link>
        </Heading>
        <p className="mt-2.5 line-clamp-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          {getPostText(post.metadata.excerpt, locale)}
        </p>
        <PostMeta post={post} locale={locale} className="mt-auto pt-5" />
      </div>
    </article>
  );
}

/** The newest post, wide, at the top of the index. */
export function FeaturedPost({
  post,
  locale,
}: {
  post: BlogPost;
  locale: SupportedLocale;
}) {
  const title = getPostText(post.metadata.title, locale);
  return (
    <article className="group relative grid overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_30px_60px_-40px_rgb(5_12_52/0.35)] lg:grid-cols-[1.15fr_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden bg-paper lg:aspect-auto lg:min-h-[24rem]">
        {post.metadata.image && (
          <Image
            src={post.metadata.image}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="kicker mb-4 flex items-center gap-2 text-muted-foreground">
          <span className="brand-gradient inline-block h-1.5 w-6 rounded-full" />
          {m.blog_latest()}
        </p>
        <h2 className="display-3 text-ink">
          <Link
            href={postHref(locale, post)}
            className="after:absolute after:inset-0"
          >
            {title}
          </Link>
        </h2>
        <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
          {getPostText(post.metadata.excerpt, locale)}
        </p>
        <div className="mt-7 flex items-center justify-between gap-4">
          <PostMeta post={post} locale={locale} />
          <span className="flex size-10 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
