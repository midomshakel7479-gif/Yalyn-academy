// Vercel serverless function.
// Extracts text from an uploaded PDF on the server, which is much more
// reliable than doing it in the browser (no worker/CDN issues, works the
// same on every device). Requires the "pdf-parse" dependency in package.json.

import pdfParse from 'pdf-parse';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfBase64 } = req.body || {};
  if (!pdfBase64) {
    return res.status(400).json({ error: 'Missing pdfBase64' });
  }

  try {
    const buffer = Buffer.from(pdfBase64, 'base64');
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim().slice(0, 20000);
    return res.status(200).json({ text, pages: data.numpages || null });
  } catch (e) {
    return res.status(500).json({ error: 'PDF extraction failed', detail: String(e) });
  }
}
