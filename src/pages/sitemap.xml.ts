import type { APIRoute } from 'astro';

const SITE = 'https://ishistory.pages.dev';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const GET: APIRoute = async () => {
  // Load all content dynamically — works for any number of series or episodes
  const allContent = import.meta.glob('../content/**/*.md', { eager: true }) as Record<string, any>;

  // Collect all unique series keys automatically
  const seriesSet = new Set<string>();
  const pages: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];

  // Static pages
  pages.push({
    url: SITE,
    lastmod: formatDate(new Date()),
    priority: '1.0',
    changefreq: 'weekly'
  });
  pages.push({
    url: `${SITE}/search/`,
    lastmod: formatDate(new Date()),
    priority: '0.8',
    changefreq: 'weekly'
  });

  // Process all content files
  for (const [path, mod] of Object.entries(allContent)) {
    const fm = mod.frontmatter;
    if (!fm.series || fm.draft || fm.coming_soon) continue;

    // Track unique series
    seriesSet.add(fm.series);

    // Episode page
    const slug = path.split('/').pop()?.replace('.md', '') ?? '';
    const lastmod = fm.date
      ? formatDate(new Date(fm.date))
      : formatDate(new Date());

    pages.push({
      url: `${SITE}/${fm.series}/${slug}/`,
      lastmod,
      priority: '0.9',
      changefreq: 'monthly'
    });
  }

  // Series index pages — one per unique series found
  for (const seriesKey of seriesSet) {
    pages.push({
      url: `${SITE}/${seriesKey}/`,
      lastmod: formatDate(new Date()),
      priority: '0.95',
      changefreq: 'weekly'
    });
  }

  // Sort: homepage first, then series pages, then episodes by URL
  pages.sort((a, b) => {
    if (a.url === SITE) return -1;
    if (b.url === SITE) return 1;
    return parseFloat(b.priority) - parseFloat(a.priority) || a.url.localeCompare(b.url);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(p => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
