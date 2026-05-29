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

function parseItem(page) {
  const p = page.properties;
  return {
    id:          page.id,
    name:        p.Name?.title?.[0]?.text?.content ?? '',
    quote_ref:   p.quote_ref?.rich_text?.[0]?.text?.content ?? '',
    item_type:   p.item_type?.select?.name ?? 'product',
    sku:         p.sku?.rich_text?.[0]?.text?.content ?? '',
    quantity:    p.quantity?.number ?? 1,
    unit_price:  p.unit_price?.number ?? 0,
    total_price: p.total_price?.number ?? 0,
  };
}

export default async function handler(req, res) {
  if (rateLimit(req, res)) return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token   = process.env.NOTION_TOKEN;
  const itemsDb = process.env.NOTION_QUOTE_ITEMS_DB_ID;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN eksik.' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id zorunlu.' });

  // ── GET — tek teklif + kalemler ───────────────────────────────
  if (req.method === 'GET') {
    const r = await fetch(`${N_API}/pages/${id}`, { headers: headers(token) });
    if (!r.ok) return res.status(404).json({ error: 'Teklif bulunamadı.' });
    const quote = parseQuote(await r.json());

    // Kalemleri getir
    let items = [];
    if (itemsDb) {
      const ir = await fetch(`${N_API}/databases/${itemsDb}/query`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
          filter: {
            property: 'quote_ref',
            rich_text: { equals: quote.quote_ref },
          },
        }),
      });
      if (ir.ok) {
        const idata = await ir.json();
        items = idata.results.map(parseItem);
      }
    }

    return res.status(200).json({ ...quote, items });
  }

  // ── PATCH — güncelle ──────────────────────────────────────────
  if (req.method === 'PATCH') {
    const updates = req.body || {};
    const props   = {};

    if (updates.status !== undefined)
      props.status = { select: { name: updates.status } };
    if (updates.admin_price !== undefined)
      props.admin_price = { number: Number(updates.admin_price) };
    if (updates.tier !== undefined)
      props.tier = { select: { name: updates.tier } };
    if (updates.notes !== undefined)
      props.notes = { rich_text: [{ text: { content: updates.notes } }] };
    if (updates.total_cost !== undefined)
      props.total_cost = { number: Number(updates.total_cost) };

    const r = await fetch(`${N_API}/pages/${id}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ properties: props }),
    });
    if (!r.ok) return res.status(500).json({ error: 'Güncelleme başarısız.' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
