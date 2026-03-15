import type { APIRoute } from 'astro';

const SITE = 'https://ishistory.pages.dev';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const GET: APIRoute = async () => {
  const allContent = import.meta.glob('../content/**/*.md', { eager: true }) as Record<string, any>;

  const seriesSet = new Set<string>();
  const pages: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];

  // Static pages
  pages.push({ url: SITE + '/', lastmod: formatDate(new Date()), priority: '1.0', changefreq: 'weekly' });
  pages.push({ url: SITE + '/search/', lastmod: formatDate(new Date()), priority: '0.8', changefreq: 'weekly' });

  // Episode pages
  for (const [path, mod] of Object.entries(allContent)) {
    const fm = mod.frontmatter;
    if (!fm.series || fm.draft || fm.coming_soon) continue;
    seriesSet.add(fm.series);
    const slug = path.split('/').pop()?.replace('.md', '') ?? '';
    const lastmod = fm.date ? formatDate(new Date(fm.date)) : formatDate(new Date());
    pages.push({ url: `${SITE}/${fm.series}/${slug}/`, lastmod, priority: '0.9', changefreq: 'monthly' });
  }

  // Series pages
  for (const seriesKey of seriesSet) {
    pages.push({ url: `${SITE}/${seriesKey}/`, lastmod: formatDate(new Date()), priority: '0.95', changefreq: 'weekly' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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

// This tells Astro to pre-render this route as a static file
export const prerender = true;
