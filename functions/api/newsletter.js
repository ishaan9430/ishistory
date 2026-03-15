const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status, headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const source = body.source ?? 'website';

  if (!email) return json({ error: 'Email is required' }, 400);
  if (!isValidEmail(email)) return json({ error: 'Invalid email address' }, 400);

  try {
    await env.NEWSLETTER_DB.prepare(
      'INSERT INTO subscribers (email, created_at, source) VALUES (?, ?, ?)'
    ).bind(email, new Date().toISOString(), source).run();

    return json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    // Unique constraint = already subscribed
    if (err.message?.includes('UNIQUE')) {
      return json({ success: true, message: 'Already subscribed' });
    }
    return json({ error: 'Something went wrong' }, 500);
  }
}
