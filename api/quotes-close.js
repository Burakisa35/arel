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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token  = process.env.NOTION_TOKEN;
  const logsDb = process.env.NOTION_QUOTE_LOGS_DB_ID;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN eksik.' });

  const {
    quote_id,
    real_cost,
    labor_hours_actual = 0,
    accepted = false,
    customer_note = '',
  } = req.body || {};

  if (!quote_id || real_cost === undefined) {
    return res.status(400).json({ error: 'quote_id ve real_cost zorunlu.' });
  }

  // Teklifi getir — satış fiyatını al
  const qr = await fetch(`${N_API}/pages/${quote_id}`, { headers: headers(token) });
  if (!qr.ok) return res.status(404).json({ error: 'Teklif bulunamadı.' });
  const page       = await qr.json();
  const p          = page.properties;
  const sale_price = p.admin_price?.number ?? 0;
  const cam_count  = p.cam_count?.number ?? 0;
  const region     = p.region?.select?.name ?? '';
  const resolution = p.resolution_mp?.number ?? 2;
  const quote_ref  = p.Name?.title?.[0]?.text?.content ?? '';
  const profit     = sale_price - Number(real_cost);

  // Status'u completed yap
  await fetch(`${N_API}/pages/${quote_id}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({
      properties: { status: { select: { name: 'completed' } } },
    }),
  });

  // Öğrenme kaydı oluştur
  if (logsDb) {
    await fetch(`${N_API}/pages`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        parent: { database_id: logsDb },
        properties: {
          Name:          { title:     [{ text: { content: `Kapanış — ${quote_ref}` } }] },
          quote_ref:     { rich_text: [{ text: { content: quote_ref } }] },
          cam_count:     { number: Number(cam_count) },
          region:        { rich_text: [{ text: { content: region } }] },
          resolution:    { rich_text: [{ text: { content: String(resolution) } }] },
          real_cost:     { number: Number(real_cost) },
          sale_price:    { number: Number(sale_price) },
          profit:        { number: Number(profit) },
          labor_hours:   { number: Number(labor_hours_actual) },
          accepted:      { checkbox: Boolean(accepted) },
          has_error:     { checkbox: false },
          completed:     { checkbox: true },
          customer_note: { rich_text: [{ text: { content: customer_note } }] },
        },
      }),
    }).catch(() => {});
  }

  return res.status(200).json({
    ok: true,
    quote_ref,
    sale_price,
    real_cost: Number(real_cost),
    profit,
    margin_pct: sale_price > 0 ? Math.round((profit / sale_price) * 100) : 0,
  });
}
