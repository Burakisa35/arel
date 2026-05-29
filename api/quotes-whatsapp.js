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

function hddLabel(gb) {
  if (gb >= 1000) return `${gb / 1000}TB`;
  return `${gb}GB`;
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
  const p    = page.properties;

  const status = p.status?.select?.name;
  if (status !== 'approved') {
    return res.status(400).json({ error: 'Teklif henüz onaylanmamış (status=approved gerekli).' });
  }

  const quote_ref    = p.Name?.title?.[0]?.text?.content ?? '';
  const customer     = p.customer_name?.rich_text?.[0]?.text?.content ?? 'Sayın Müşterimiz';
  const cam_count    = p.cam_count?.number ?? 0;
  const channel      = p.channel?.number ?? 0;
  const hdd_gb       = p.hdd_gb?.number ?? 0;
  const days         = p.days?.number ?? 30;
  const resolution   = p.resolution_mp?.number ?? 2;
  const tier_label   = p.tier?.select?.name ?? '';
  const admin_price  = p.admin_price?.number ?? 0;

  const msg = [
    `Merhaba ${customer},`,
    `TEHAŞ Güvenlik Kamera Teklifimiz`,
    `Ref: ${quote_ref}`,
    '—',
    `Sistem: ${cam_count} kamera, ${channel}ch DVR, ${hddLabel(hdd_gb)} HDD`,
    `Kayıt: ${days} gün / ${resolution}MP`,
    '—',
    `Paket: ${tier_label}`,
    `Fiyat: ₺${admin_price.toLocaleString('tr-TR')} (KDV dahil)`,
    '—',
    'Bilgi için WhatsApp üzerinden yazabilirsiniz.',
  ].join('\n');

  return res.status(200).json({ message: msg, quote_ref, admin_price });
}
