import rateLimit from './_rateLimit.js';

const N_API  = 'https://api.notion.com/v1';
const N_VER  = '2022-06-28';

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': N_VER,
  };
}

function parseProduct(page) {
  const p = page.properties;
  return {
    id:           page.id,
    name:         p.Name?.title?.[0]?.text?.content ?? '',
    sku:          p.sku?.rich_text?.[0]?.text?.content ?? '',
    category:     p.category?.select?.name ?? '',
    unit_price:   p.unit_price?.number ?? 0,
    last_updated: p.last_updated?.date?.start ?? page.last_edited_time?.split('T')[0] ?? '',
  };
}

export default async function handler(req, res) {
  if (rateLimit(req, res)) return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_PRODUCTS_DB_ID;
  if (!token || !dbId) return res.status(500).json({ error: 'NOTION_PRODUCTS_DB_ID eksik.' });

  // ── GET — ürünleri listele ────────────────────────────────────
  if (req.method === 'GET') {
    const { category } = req.query;
    const body = {};
    if (category) {
      body.filter = {
        property: 'category',
        select: { equals: category },
      };
    }
    body.sorts = [{ property: 'Name', direction: 'ascending' }];

    const r = await fetch(`${N_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    });
    if (!r.ok) return res.status(500).json({ error: 'Ürünler alınamadı.' });
    const data = await r.json();
    return res.status(200).json(data.results.map(parseProduct));
  }

  // ── POST — yeni ürün ekle ─────────────────────────────────────
  if (req.method === 'POST') {
    const { name, sku = '', category = 'accessory', unit_price = 0 } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Ürün adı zorunlu.' });

    const page = {
      parent: { database_id: dbId },
      properties: {
        Name:         { title:     [{ text: { content: name } }] },
        sku:          { rich_text: [{ text: { content: sku } }] },
        category:     { select:    { name: category } },
        unit_price:   { number:    Number(unit_price) },
        last_updated: { date:      { start: new Date().toISOString().split('T')[0] } },
      },
    };

    const r = await fetch(`${N_API}/pages`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(page),
    });
    if (!r.ok) return res.status(500).json({ error: 'Ürün eklenemedi.' });
    const created = await r.json();
    return res.status(201).json(parseProduct(created));
  }

  // ── PATCH — fiyat güncelle ────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, unit_price } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id zorunlu.' });

    const r = await fetch(`${N_API}/pages/${id}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({
        properties: {
          unit_price:   { number: Number(unit_price) },
          last_updated: { date: { start: new Date().toISOString().split('T')[0] } },
        },
      }),
    });
    if (!r.ok) return res.status(500).json({ error: 'Güncelleme başarısız.' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
