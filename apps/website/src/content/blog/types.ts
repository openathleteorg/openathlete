import type { ReactNode } from 'react';

/** English and French are required; other locales fall back to English. */
export interface LocalizedText {
  en: string;
  fr: string;
  es?: string;
  it?: string;
  'pt-br'?: string;
  de?: string;
}

export interface BlogPostMetadata {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  excerpt: LocalizedText;
  author: {
    name: string;
    email?: string;
  };
  publishedAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  tags?: string[];
  image?: string; // Path to image
  readingTime?: number; // Minutes
}

export interface BlogPost {
  metadata: BlogPostMetadata;
  ContentEn: () => ReactNode;
  ContentFr: () => ReactNode;
  /** Without them, the page in that language shows the English body. */
  ContentEs?: () => ReactNode;
  ContentIt?: () => ReactNode;
  ContentPtBr?: () => ReactNode;
  ContentDe?: () => ReactNode;
}
