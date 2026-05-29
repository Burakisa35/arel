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
  const errDb  = process.env.NOTION_QUOTE_ERROR_LOGS_DB_ID;
  if (!token || !logsDb) return res.status(500).json({ error: 'NOTION_QUOTE_LOGS_DB_ID eksik.' });

  const { region, date_from, date_to } = req.query;

  // Filtre oluştur
  const filters = [{ property: 'completed', checkbox: { equals: true } }];
  if (region) filters.push({ property: 'region', rich_text: { equals: region } });

  const body = {
    filter: filters.length === 1 ? filters[0] : { and: filters },
    page_size: 100,
  };

  const r = await fetch(`${N_API}/databases/${logsDb}/query`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) return res.status(500).json({ error: 'Log veritabanı okunamadı.' });
  const data    = await r.json();
  const records = data.results;

  // İstatistikleri hesapla
  const total = records.length;
  const accepted = records.filter(r => r.properties.accepted?.checkbox).length;
  const profits  = records
    .map(r => r.properties.profit?.number ?? 0)
    .filter(v => typeof v === 'number');
  const salePrices = records
    .map(r => r.properties.sale_price?.number ?? 0)
    .filter(v => v > 0);

  const avg_kar = profits.length
    ? Math.round(profits.reduce((a, b) => a + b, 0) / profits.length)
    : 0;
  const avg_kar_pct = salePrices.length
    ? Math.round(
        records.reduce((sum, r) => {
          const s = r.properties.sale_price?.number ?? 0;
          const p = r.properties.profit?.number ?? 0;
          return sum + (s > 0 ? (p / s) * 100 : 0);
        }, 0) / salePrices.length
      )
    : 0;

  // Hata dağılımı
  let hata_dagilimi = [];
  if (errDb) {
    const er = await fetch(`${N_API}/databases/${errDb}/query`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ page_size: 100 }),
    });
    if (er.ok) {
      const edata = await er.json();
      const errMap = {};
      for (const rec of edata.results) {
        const t = rec.properties.error_type?.rich_text?.[0]?.text?.content ?? 'bilinmeyen';
        errMap[t] = (errMap[t] || 0) + 1;
      }
      hata_dagilimi = Object.entries(errMap).map(([type, count]) => ({ type, count }));
    }
  }

  return res.status(200).json({
    toplam_teklif:    total,
    kabul_sayisi:     accepted,
    kabul_orani:      total > 0 ? Math.round((accepted / total) * 100) : 0,
    ort_kar:          avg_kar,
    ort_kar_yuzdesi:  avg_kar_pct,
    hata_dagilimi,
  });
}
