// Tek seferlik çalıştırılacak tohum endpoint'i.
// GET /api/seed-products?secret=SEED_SECRET
// SEED_SECRET env değişkeni ile koruma altında.

const N_API = 'https://api.notion.com/v1';
const N_VER = '2022-06-28';

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': N_VER,
  };
}

// AHD güvenlik sistemi ürün kataloğu — 2026 Türkiye piyasası
const PRODUCTS = [
  // DVR'lar
  { name: '4 Kanal AHD DVR',        sku: 'DVR-4CH',   category: 'dvr',       unit_price: 1850 },
  { name: '8 Kanal AHD DVR',        sku: 'DVR-8CH',   category: 'dvr',       unit_price: 2900 },
  { name: '16 Kanal AHD DVR',       sku: 'DVR-16CH',  category: 'dvr',       unit_price: 4600 },
  { name: '32 Kanal AHD DVR',       sku: 'DVR-32CH',  category: 'dvr',       unit_price: 8200 },
  // Kameralar
  { name: '2MP AHD Kamera (İç)',    sku: 'CAM-2MP-I', category: 'camera',    unit_price: 660 },
  { name: '2MP AHD Kamera (Dış)',   sku: 'CAM-2MP-O', category: 'camera',    unit_price: 820 },
  { name: '4MP AHD Kamera (Dış)',   sku: 'CAM-4MP-O', category: 'camera',    unit_price: 1120 },
  // HDD
  { name: '1TB Güvenlik HDD',       sku: 'HDD-1TB',   category: 'hdd',       unit_price: 1450 },
  { name: '2TB Güvenlik HDD',       sku: 'HDD-2TB',   category: 'hdd',       unit_price: 2250 },
  { name: '4TB Güvenlik HDD',       sku: 'HDD-4TB',   category: 'hdd',       unit_price: 3900 },
  { name: '6TB Güvenlik HDD',       sku: 'HDD-6TB',   category: 'hdd',       unit_price: 5600 },
  // Güç kaynakları
  { name: 'Güç Kaynağı 12V 5A',     sku: 'PSU-5A',    category: 'accessory', unit_price: 360 },
  { name: 'Güç Kaynağı 12V 10A',    sku: 'PSU-10A',   category: 'accessory', unit_price: 560 },
  // Kablolar
  { name: 'Koaksiyel Kablo (m)',    sku: 'CBL-COAX',  category: 'cable',     unit_price: 18 },
  { name: 'CAT6 Kablo (m)',         sku: 'CBL-CAT6',  category: 'cable',     unit_price: 16 },
  // Aksesuarlar
  { name: 'Klemens Seti',           sku: 'ACC-KLEM',  category: 'accessory', unit_price: 125 },
  { name: 'Vida / Dübel Seti',      sku: 'ACC-VIDA',  category: 'accessory', unit_price: 85 },
  { name: 'Kablo Kanalı (m)',       sku: 'ACC-KANAL', category: 'accessory', unit_price: 36 },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Sadece GET' });

  const secret = process.env.SEED_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(403).json({ error: 'Yetkisiz.' });
  }

  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_PRODUCTS_DB_ID;
  if (!token || !dbId) return res.status(500).json({ error: 'Env eksik.' });

  const today = new Date().toISOString().split('T')[0];
  const results = [];

  for (const p of PRODUCTS) {
    const r = await fetch(`${N_API}/pages`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name:         { title:     [{ text: { content: p.name } }] },
          sku:          { rich_text: [{ text: { content: p.sku  } }] },
          category:     { select:    { name: p.category } },
          unit_price:   { number:    p.unit_price },
          last_updated: { date:      { start: today } },
        },
      }),
    });
    results.push({ name: p.name, ok: r.ok, status: r.status });
  }

  const failed = results.filter(r => !r.ok);
  return res.status(200).json({
    inserted: results.filter(r => r.ok).length,
    failed:   failed.length,
    details:  failed,
  });
}
