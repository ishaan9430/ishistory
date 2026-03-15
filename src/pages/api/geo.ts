import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  // Cloudflare automatically adds CF-IPCountry header
  const country = request.headers.get('CF-IPCountry') ?? '';

  return new Response(JSON.stringify({ country }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store' // Never cache — each user has different location
    }
  });
};
