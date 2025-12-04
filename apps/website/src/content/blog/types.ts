import type { ReactNode } from 'react';

export interface BlogPostMetadata {
  slug: string;
  title: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  excerpt: {
    en: string;
    fr: string;
  };
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
}
