import type { APIRoute } from 'astro';

function stripMd(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .trim();
}

export const GET: APIRoute = async ({ site }) => {
  const allContent = import.meta.glob('../content/**/*.md', { eager: true }) as Record<string, any>;

  const index = Object.entries(allContent)
    .filter(([, mod]) => {
      const fm = mod.frontmatter;
      return fm.series && !fm.draft && !fm.coming_soon;
    })
    .map(([path, mod]) => {
      const fm = mod.frontmatter;
      const slug = path.split('/').pop()?.replace('.md', '') ?? '';
      const body = typeof mod.rawContent === 'function' ? mod.rawContent() : '';
      return {
        slug,
        series: fm.series,
        title: fm.title ?? slug,
        description: fm.description ?? '',
        tag: fm.tag ?? '',
        episode_number: fm.episode_number ?? '',
        roman: fm.roman ?? '',
        bodyText: stripMd(body).slice(0, 2000),
      };
    })
    .sort((a, b) => Number(a.episode_number) - Number(b.episode_number));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' }
  });
};
