import { m } from '@/paraglide/messages';
import { useEffect } from 'react';

export function SEOHead() {
  useEffect(() => {
    document.title = m.landing_seo_title();

    const updateMetaTag = (
      selector: string,
      attribute: string,
      value: string,
    ) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name="')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) element.setAttribute('name', name);
        } else if (selector.startsWith('meta[property="')) {
          const property = selector.match(/property="([^"]+)"/)?.[1];
          if (property) element.setAttribute('property', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    updateMetaTag(
      'meta[name="description"]',
      'content',
      m.landing_seo_description(),
    );
    updateMetaTag(
      'meta[property="og:title"]',
      'content',
      m.landing_seo_title(),
    );
    updateMetaTag(
      'meta[property="og:description"]',
      'content',
      m.landing_seo_description(),
    );
    updateMetaTag('meta[property="og:type"]', 'content', 'website');
    updateMetaTag(
      'meta[property="og:url"]',
      'content',
      'https://openathlete.org',
    );
    updateMetaTag(
      'meta[name="twitter:card"]',
      'content',
      'summary_large_image',
    );
    updateMetaTag(
      'meta[name="twitter:title"]',
      'content',
      m.landing_seo_title(),
    );
    updateMetaTag(
      'meta[name="twitter:description"]',
      'content',
      m.landing_seo_description(),
    );
  }, []);

  return null;
}
