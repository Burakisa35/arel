import rateLimit from './_rateLimit.js';

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

  const token  = process.env.NOTION_TOKEN;
  const logsDb = process.env.NOTION_QUOTE_LOGS_DB_ID;
  if (!token || !logsDb) return res.status(500).json({ found: false });

  const cam_count  = parseInt(req.query.cam_count || '0', 10);
  const region     = req.query.region     || '';
  const resolution = req.query.resolution || '';

  // Tamamlanmış ve hatasız kayıtları çek
  const r = await fetch(`${N_API}/databases/${logsDb}/query`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'completed', checkbox: { equals: true } },
          { property: 'has_error', checkbox: { equals: false } },
        ],
      },
      page_size: 100,
    }),
  });
  if (!r.ok) return res.status(200).json({ found: false });
  const data    = await r.json();
  const records = data.results;

  // Filtrele: cam_count ±2, region eşit, resolution eşit
  const matches = records.filter(rec => {
    const p  = rec.properties;
    const cc = p.cam_count?.number ?? 0;
    const rg = p.region?.rich_text?.[0]?.text?.content ?? '';
    const rs = p.resolution?.rich_text?.[0]?.text?.content ?? '';

    const camOk = Math.abs(cc - cam_count) <= 2;
    const regOk = !region     || rg === region;
    const resOk = !resolution || rs === resolution;
    return camOk && regOk && resOk;
  });

  if (matches.length === 0) return res.status(200).json({ found: false });

  const prices   = matches.map(r => r.properties.sale_price?.number ?? 0).filter(v => v > 0);
  const accepted = matches.filter(r => r.properties.accepted?.checkbox).length;

  return res.status(200).json({
    found:           true,
    count:           matches.length,
    min_price:       Math.min(...prices),
    max_price:       Math.max(...prices),
    avg_price:       Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    acceptance_rate: Math.round((accepted / matches.length) * 100),
  });
}
