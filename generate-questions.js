// Vercel serverless function.
// Keeps the Anthropic API key on the server — never expose it in the browser.
// Requires an environment variable ANTHROPIC_API_KEY to be set in the
// Vercel project settings (Project → Settings → Environment Variables).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contentText, gradeLabel } = req.body || {};
  if (!contentText || !gradeLabel) {
    return res.status(400).json({ error: 'Missing contentText or gradeLabel' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const system = `You are an expert K-12 curriculum question-bank writer. Given lesson content for the level "${gradeLabel}", write exactly 6 exam questions calibrated to that grade's difficulty: 4 multiple-choice and 2 short-answer. Reply with ONLY a raw JSON array, no markdown fences, no commentary. Each element must be exactly:
{"type":"mcq","question":"...","options":["...","...","...","..."],"answer":"the exact text of the correct option"}
or
{"type":"short","question":"...","answer":"a concise 1-2 sentence model answer used later for grading"}
Write all question/option/answer text in the same language as the lesson content provided.`;

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
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: `Lesson content:\n${contentText}` }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: errText });
    }

    const data = await resp.json();
    const text = (data.content || []).map((b) => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);
    return res.status(200).json({ questions });
  } catch (e) {
    return res.status(500).json({ error: 'Question generation failed', detail: String(e) });
  }
}
