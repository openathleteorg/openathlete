/**
 * Long-form typography for articles and legal pages, on top of
 * @tailwindcss/typography, tuned to the site's navy and accents.
 */
export const proseStyles = [
  'prose prose-lg max-w-none',
  '[--tw-prose-body:#2b3354] [--tw-prose-headings:var(--ink)] [--tw-prose-bold:var(--ink)]',
  '[--tw-prose-links:var(--ink)] [--tw-prose-bullets:var(--orchid)] [--tw-prose-counters:var(--muted-foreground)]',
  '[--tw-prose-quotes:var(--ink)] [--tw-prose-quote-borders:var(--sky)] [--tw-prose-hr:var(--border)]',
  '[--tw-prose-th-borders:var(--border)] [--tw-prose-td-borders:var(--border)] [--tw-prose-code:var(--ink)]',
  'prose-headings:font-semibold prose-headings:tracking-[-0.025em]',
  'prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-[1.7rem] prose-h2:leading-tight',
  'prose-h3:mt-10 prose-h3:text-[1.25rem]',
  'prose-p:leading-[1.75] prose-li:leading-[1.7] prose-li:my-1.5',
  'prose-a:font-medium prose-a:underline prose-a:decoration-sky/70 prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:decoration-orchid',
  'prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:bg-paper prose-blockquote:rounded-r-xl prose-blockquote:py-1',
  'prose-table:text-[0.95rem] prose-th:text-left prose-th:font-semibold',
  '[&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table',
  'prose-img:rounded-2xl',
].join(' ');
