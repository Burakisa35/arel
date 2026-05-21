const allowedOrigins = [
  'https://arel-phi.vercel.app',
  'https://tehas.tr',
  'https://www.tehas.tr'
];

const ipHits = new Map();

function sanitize(value = '') {
  return String(value).replace(/[<>]/g, '').trim().slice(0, 160);
}

function normalizeRef(value = '') {
  return sanitize(value).toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '').slice(0, 32);
}

function getIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const limit = 20;
  const current = ipHits.get(ip) || [];
  const filtered = current.filter(ts => now - ts < windowMs);
  filtered.push(now);
  ipHits.set(ip, filtered);
  return filtered.length <= limit;
}

function titleText(prop) {
  return prop?.title?.map(t => t.plain_text).join('') || '';
}

function parseRef(text, fallback = '') {
  return text.match(/\b(?:AB|TH|THS)-[A-Z0-9-]+\b/i)?.[0]?.toUpperCase() || fallback || 'AB-UNKNOWN';
}

function inferStatus(createdTime) {
  const created = new Date(createdTime || Date.now()).getTime();
  const ageMin = Math.max(0, Math.floor((Date.now() - created) / 60000));
  if (ageMin >= 240) return 'tamamlandi';
  if (ageMin >= 90) return 'yolda';
  if (ageMin >= 30) return 'teknisyen_atandi';
  if (ageMin >= 8) return 'inceleniyor';
  return 'pending';
}

async function queryNotion(filter, headers, dbId) {
  const notionRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ page_size: 10, filter })
  });

  if (!notionRes.ok) {
    const err = await notionRes.json().catch(() => ({}));
    throw new Error(err.message || 'Notion sorgusu baÅarÄ±sÄ±z.');
  }

  return notionRes.json();
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Ãok fazla sorgu gÃ¶nderildi. 5 dakika sonra tekrar deneyin.' });
  }

  try {
    const ref = normalizeRef(req.query.ref || '');
    const name = sanitize(req.query.name || '');
    const phoneLast4 = sanitize(req.query.phoneLast4 || '').replace(/\D/g, '').slice(0, 4);

    if (!ref && !(name.length >= 2 && phoneLast4.length === 4)) {
      return res.status(400).json({ error: 'REF veya ad + telefon son 4 hane gerekli.' });
    }

    const token = process.env.NOTION_TOKEN;
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!token || !dbId) {
      return res.status(500).json({ error: 'Sunucu yapÄ±landÄ±rma hatasÄ±. NOTION_TOKEN veya NOTION_DATABASE_ID eksik.' });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };

    const filter = ref
      ? { property: 'Name', title: { contains: ref } }
      : { property: 'Name', title: { contains: name } };

    const notionData = await queryNotion(filter, headers, dbId);
    const results = Array.isArray(notionData.results) ? notionData.results : [];

    if (results.length === 0) {
      return res.status(404).json({ error: 'Bu bilgilere ait talep bulunamadÄ±.' });
    }

    const page = results[0];
    const titleProp = Object.values(page.properties || {}).find(p => p.type === 'title');
    const title = titleText(titleProp);
    const extractedRef = parseRef(title, ref);

    return res.status(200).json({
      success: true,
      data: {
        ref: extractedRef,
        problem: 'Talep kaydÄ±',
        bolge: 'Saha bilgisi inceleniyor',
        durum: inferStatus(page.created_time),
        guncelleme: page.last_edited_time || page.created_time || new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('durum-sorgula error:', err);
    return res.status(500).json({ error: 'Durum sorgulama sÄ±rasÄ±nda hata oluÅtu.' });
  }
}
