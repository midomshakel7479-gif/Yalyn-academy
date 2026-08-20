// Vercel serverless function.
// Keeps the Anthropic API key on the server — never expose it in the browser.
// Requires an environment variable ANTHROPIC_API_KEY to be set in the
// Vercel project settings (Project → Settings → Environment Variables).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing items array' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const system = `You are grading short-answer exam responses for a K-12 student. For each item compare the student's answer to the model answer; be reasonably lenient about wording but require the core idea to be correct. Reply with ONLY a raw JSON array (same order, no markdown fences): [{"score":1,"feedback":"one short sentence, same language as the question"}] where score is 0 or 1.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: JSON.stringify(items) }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: errText });
    }

    const data = await resp.json();
    const text = (data.content || []).map((b) => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(clean);
    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: 'Grading failed', detail: String(e) });
  }
}
