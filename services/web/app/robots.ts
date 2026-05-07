import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.WEB_URL ?? 'https://noetia.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/upload-guide', '/pricing', '/legal/'],
        disallow: [
          '/api/',
          '/admin',
          '/library',
          '/discover',
          '/reader/',
          '/fragments',
          '/profile',
          '/author',
          '/onboarding',
          '/auth/',
          '/social',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
