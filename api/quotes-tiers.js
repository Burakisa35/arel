import rateLimit from './_rateLimit.js';
import { calcTiers } from './_quoteEngine.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN eksik.' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id zorunlu.' });

  const r = await fetch(`${N_API}/pages/${id}`, { headers: headers(token) });
  if (!r.ok) return res.status(404).json({ error: 'Teklif bulunamadı.' });
  const page = await r.json();
  const total_cost = page.properties?.total_cost?.number ?? 0;
  if (!total_cost) return res.status(400).json({ error: 'total_cost hesaplanmamış.' });

  return res.status(200).json(calcTiers(total_cost));
}
