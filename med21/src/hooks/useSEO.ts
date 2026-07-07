import { useEffect } from 'react';

interface SEOData {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
}

const SITE_NAME = 'MedZiva Healthcare';
const DEFAULT_DESCRIPTION = 'Premium healthcare marketplace in Dubai — book home healthcare, lab tests, IV therapy, and medical equipment rental from DHA-compliant providers.';
const DEFAULT_OG_IMAGE = '/b23.png';

export function useSEO({ title, description, canonicalPath, ogImage }: SEOData) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description || DEFAULT_DESCRIPTION);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description || DEFAULT_DESCRIPTION, true);
    setMeta('og:image', ogImage || DEFAULT_OG_IMAGE, true);
    setMeta('og:type', 'website', true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('twitter:card', 'summary_large_image');

    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `https://medzivahealthcare.com${canonicalPath}`);
    }
  }, [title, description, canonicalPath, ogImage]);
}
