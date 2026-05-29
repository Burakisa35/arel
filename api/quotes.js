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

function genQuoteRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n) => Array.from({ length: n }, () =>
    chars[Math.floor(Math.random() * chars.length)]).join('');
  return `Q-${seg(3)}-${seg(3)}`;
}

function parseQuote(page) {
  const p = page.properties;
  return {
    id:            page.id,
    quote_ref:     p.Name?.title?.[0]?.text?.content ?? '',
    request_ref:   p.request_ref?.rich_text?.[0]?.text?.content ?? '',
    customer_name: p.customer_name?.rich_text?.[0]?.text?.content ?? '',
    cam_count:     p.cam_count?.number ?? 0,
    resolution_mp: p.resolution_mp?.number ?? 2,
    days:          p.days?.number ?? 30,
    region:        p.region?.select?.name ?? '',
    channel:       p.channel?.number ?? 0,
    hdd_gb:        p.hdd_gb?.number ?? 0,
    status:        p.status?.select?.name ?? 'draft',
    admin_price:   p.admin_price?.number ?? 0,
    total_cost:    p.total_cost?.number ?? 0,
    tier:          p.tier?.select?.name ?? '',
    notes:         p.notes?.rich_text?.[0]?.text?.content ?? '',
    created_at:    page.created_time,
  };
}

export default async function handler(req, res) {
  if (rateLimit(req, res)) return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token  = process.env.NOTION_TOKEN;
  const dbId   = process.env.NOTION_QUOTES_DB_ID;
  const itemsDb = process.env.NOTION_QUOTE_ITEMS_DB_ID;
  if (!token || !dbId) return res.status(500).json({ error: 'NOTION_QUOTES_DB_ID eksik.' });

  // ── GET — teklif listesi ──────────────────────────────────────
  if (req.method === 'GET') {
    const { status } = req.query;
    const body = {};
    if (status) {
      body.filter = { property: 'status', select: { equals: status } };
    }
    body.sorts = [{ timestamp: 'created_time', direction: 'descending' }];

    const r = await fetch(`${N_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    });
    if (!r.ok) return res.status(500).json({ error: 'Teklifler alınamadı.' });
    const data = await r.json();
    return res.status(200).json(data.results.map(parseQuote));
  }

  // ── POST — yeni teklif oluştur ────────────────────────────────
  if (req.method === 'POST') {
    const {
      request_ref = '', customer_name = '', cam_count = 0,
      resolution_mp = 2, days = 30, region = '', channel = 0,
      hdd_gb = 0, total_cost = 0, items = [], notes = '',
    } = req.body || {};

    const quote_ref = genQuoteRef();

    const page = {
      parent: { database_id: dbId },
      properties: {
        Name:          { title:     [{ text: { content: quote_ref } }] },
        request_ref:   { rich_text: [{ text: { content: request_ref } }] },
        customer_name: { rich_text: [{ text: { content: customer_name } }] },
        cam_count:     { number: Number(cam_count) },
        resolution_mp: { number: Number(resolution_mp) },
        days:          { number: Number(days) },
        region:        { select: { name: region || 'kemalpasa' } },
        channel:       { number: Number(channel) },
        hdd_gb:        { number: Number(hdd_gb) },
        total_cost:    { number: Number(total_cost) },
        status:        { select: { name: 'draft' } },
        notes:         { rich_text: [{ text: { content: notes } }] },
      },
    };

    const r = await fetch(`${N_API}/pages`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(page),
    });
    if (!r.ok) return res.status(500).json({ error: 'Teklif oluşturulamadı.' });
    const created = await r.json();

    // Kalemleri kaydet
    if (itemsDb && items.length > 0) {
      await Promise.all(items.map(item =>
        fetch(`${N_API}/pages`, {
          method: 'POST',
          headers: headers(token),
          body: JSON.stringify({
            parent: { database_id: itemsDb },
            properties: {
              Name:        { title:     [{ text: { content: item.name || '' } }] },
              quote_ref:   { rich_text: [{ text: { content: quote_ref } }] },
              item_type:   { select:    { name: item.item_type || 'product' } },
              sku:         { rich_text: [{ text: { content: item.sku || '' } }] },
              quantity:    { number: Number(item.quantity || 1) },
              unit_price:  { number: Number(item.unit_price || 0) },
              total_price: { number: Number((item.quantity || 1) * (item.unit_price || 0)) },
            },
          }),
        })
      ));
    }

    return res.status(201).json({ quote_id: created.id, ref_code: quote_ref });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
