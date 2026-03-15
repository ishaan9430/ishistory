const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const EMOJIS = ['❤️', '🔥', '🤯', '📚', '👏'];

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const key = `reactions:${slug}`;

  // GET — return current counts
  if (request.method === 'GET') {
    const data = await env.REACTIONS.get(key, { type: 'json' });
    const counts = data ?? { '❤️': 0, '🔥': 0, '🤯': 0, '📚': 0, '👏': 0 };
    return new Response(JSON.stringify(counts), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  // POST — increment a reaction
  if (request.method === 'POST') {
    const body = await request.json();
    const emoji = body.emoji;

    if (!EMOJIS.includes(emoji)) {
      return new Response(JSON.stringify({ error: 'Invalid emoji' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const data = await env.REACTIONS.get(key, { type: 'json' });
    const counts = data ?? { '❤️': 0, '🔥': 0, '🤯': 0, '📚': 0, '👏': 0 };
    counts[emoji] = (counts[emoji] ?? 0) + 1;

    await env.REACTIONS.put(key, JSON.stringify(counts));

    return new Response(JSON.stringify(counts), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
}
