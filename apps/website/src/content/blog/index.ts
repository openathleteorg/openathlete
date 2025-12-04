import { article1 } from './article-1';
import { article2 } from './article-2';
import { article3 } from './article-3';
import type { BlogPost } from './types';

// Export all blog posts
export const blogPosts: BlogPost[] = [article1, article2, article3];

// Helper function to get a post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.metadata.slug === slug);
}

// Helper function to get all posts sorted by date (newest first)
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );
}

// Helper function to get posts by tag
export function getPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter((post) =>
    post.metadata.tags?.some((t) =>
      t.toLowerCase().includes(tag.toLowerCase()),
    ),
  );
}
