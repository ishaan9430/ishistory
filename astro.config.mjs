import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ishistory.pages.dev',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/search-index') &&
        !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: new Date(),
    })
  ],
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});
