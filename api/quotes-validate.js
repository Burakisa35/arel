import rateLimit from './_rateLimit.js';
import { validateQuote } from './_quoteEngine.js';

const N_API = 'https://api.notion.com/v1';
const N_VER = '2022-06-28';

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': N_VER,
  };
}

export default async function handler(req, res) {
  if (rateLimit(req, res)) return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { quote_id, items, summary } = req.body || {};
  if (!items || !summary) return res.status(400).json({ error: 'items ve summary zorunlu.' });

  const result = validateQuote(items, summary);

  // Hata varsa quote_error_logs'a yaz
  const token  = process.env.NOTION_TOKEN;
  const errDb  = process.env.NOTION_QUOTE_ERROR_LOGS_DB_ID;
  if (!result.canSave && quote_id && token && errDb) {
    for (const errMsg of result.errors) {
      await fetch(`${N_API}/pages`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
          parent: { database_id: errDb },
          properties: {
            Name:       { title:     [{ text: { content: `Hata — ${quote_id}` } }] },
            quote_ref:  { rich_text: [{ text: { content: quote_id } }] },
            error_type: { rich_text: [{ text: { content: 'validation' } }] },
            message:    { rich_text: [{ text: { content: errMsg } }] },
          },
        }),
      }).catch(() => {});
    }
  }

  return res.status(200).json(result);
}
