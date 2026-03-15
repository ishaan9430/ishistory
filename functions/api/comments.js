const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status, headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) return json({ error: 'Missing slug' }, 400);

  // GET — return approved comments for this episode
  if (request.method === 'GET') {
    const result = await env.NEWSLETTER_DB.prepare(
      'SELECT id, name, message, created_at FROM comments WHERE slug = ? AND approved = 1 ORDER BY created_at ASC'
    ).bind(slug).all();
    return json(result.results ?? []);
  }

  // POST — submit a new comment
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    const name = (body.name ?? '').trim().slice(0, 60);
    const message = (body.message ?? '').trim().slice(0, 1000);

    if (!name) return json({ error: 'Name is required' }, 400);
    if (!message) return json({ error: 'Message is required' }, 400);
    if (message.length < 3) return json({ error: 'Comment is too short' }, 400);

    // Basic spam check
    const spamWords = ['http://', 'https://', 'www.', 'buy ', 'click here', 'casino'];
    const lower = message.toLowerCase();
    if (spamWords.some(w => lower.includes(w))) {
      return json({ error: 'Comment contains invalid content' }, 400);
    }

    await env.NEWSLETTER_DB.prepare(
      'INSERT INTO comments (slug, name, message, created_at, approved) VALUES (?, ?, ?, ?, 1)'
    ).bind(slug, name, message, new Date().toISOString()).run();

    return json({ success: true, message: 'Comment posted' });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
}
