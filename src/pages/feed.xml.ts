import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const allContent = import.meta.glob('../content/**/*.md', { eager: true }) as Record<string, any>;
  const siteUrl = 'https://ishistory.pages.dev';

  const items = Object.entries(allContent)
    .filter(([, mod]) => {
      const fm = mod.frontmatter;
      return fm.series && !fm.draft && !fm.coming_soon;
    })
    .map(([path, mod]) => {
      const fm = mod.frontmatter;
      const slug = path.split('/').pop()?.replace('.md', '') ?? '';
      return {
        title: fm.title ?? slug,
        description: fm.description ?? '',
        url: `${siteUrl}/${fm.series}/${slug}/`,
        date: fm.date ? new Date(fm.date) : new Date(),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 50);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ishistory</title>
    <link>${siteUrl}</link>
    <description>The history behind the ideas shaping our world.</description>
    <language>en-gb</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.map(item => `<item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.url}</link>
      <guid>${item.url}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
    </item>`).join('\n    ')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
};
