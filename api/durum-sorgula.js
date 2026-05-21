const allowedOrigins = [
  'https://arel-phi.vercel.app',
  'https://tehas.tr'
];

const ipHits = new Map();

function sanitize(value = '') {
  return String(value)
    .replace(/[<>]/g, '')
    .trim();
}

function normalizeRef(value = '') {
  return sanitize(value)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const limit = 20;

  if (!ipHits.has(ip)) {
    ipHits.set(ip, []);
  }

  const filtered = ipHits
    .get(ip)
    .filter(ts => now - ts < windowMs);

  filtered.push(now);

  ipHits.set(ip, filtered);

  return filtered.length <= limit;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }

  res.setHeader(
    'Access-Control-Allow-Origin',
    origin || allowedOrigins[0]
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const ip = getIp(req);

  if (!rateLimit(ip)) {
    return res.status(429).json({
      error: 'Çok fazla sorgu gönderildi.'
    });
  }

  try {
    const ref = normalizeRef(req.query.ref || '');
    const name = sanitize(req.query.name || '');
    const phoneLast4 = sanitize(
      req.query.phoneLast4 || ''
    ).replace(/\D/g, '');

    if (!ref && !(name && phoneLast4)) {
      return res.status(400).json({
        error: 'Eksik sorgu parametresi.'
      });
    }

    const token = process.env.NOTION_TOKEN;
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!token || !dbId) {
      return res.status(500).json({
        error: 'Sunucu yapılandırma hatası.'
      });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };

    let filter = null;

    if (ref) {
      filter = {
        property: 'Name',
        title: {
          contains: ref
        }
      };
    } else {
      filter = {
        and: [
          {
            property: 'Name',
            title: {
              contains: name
            }
          }
        ]
      };
    }

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          page_size: 10,
          filter
        })
      }
    );

    const notionData = await notionRes.json();

    if (
      !notionData.results ||
      notionData.results.length === 0
    ) {
      return res.status(404).json({
        error:
          'Bu bilgilere ait talep bulunamadı.'
      });
    }

    const page = notionData.results[0];

    const title =
      page.properties?.Name?.title?.[0]
        ?.plain_text || '';

    const extractedRef =
      title.match(/(AB-[A-Z0-9]+)/)?.[1] ||
      ref ||
      'AB-UNKNOWN';

    const mockStatusFlow = [
      'pending',
      'inceleniyor',
      'teknisyen_atandi',
      'yolda',
      'tamamlandi'
    ];

    const created =
      page.created_time || new Date().toISOString();

    const randomIndex =
      Math.min(
        3,
        Math.floor(
          (Date.now() -
            new Date(created).getTime()) /
            (1000 * 60 * 30)
        )
      );

    const status =
      mockStatusFlow[randomIndex];

    return res.status(200).json({
      success: true,
      data: {
        ref: extractedRef,
        problem:
          'Kamerayı telefondan izleyemiyorum',
        bolge: 'Kemalpaşa Merkez',
        durum: status,
        guncelleme: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error:
        'Durum sorgulama sırasında hata oluştu.'
    });
  }
}