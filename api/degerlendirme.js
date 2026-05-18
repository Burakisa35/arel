export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ref, rating, comment } = req.body || {};

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Geçerli bir puan gerekli (1-5).' });
  }

  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DATABASE_ID || 'dbb5f0363d514f84b24c11e297d86c9c';

  if (!token) {
    return res.status(500).json({ error: 'Sunucu yapılandırma hatası. NOTION_TOKEN eksik.' });
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const tarih = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  // If ref provided, try to find and update the existing page
  if (ref) {
    try {
      const queryRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            property: 'title',
            title: { contains: ref }
          },
          page_size: 1
        })
      });

      if (queryRes.ok) {
        const queryData = await queryRes.json();
        if (queryData.results && queryData.results.length > 0) {
          const pageId = queryData.results[0].id;
          // Append rating block to existing page
          const appendRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              children: [
                divider(),
                heading('Müşteri Değerlendirmesi'),
                para(`⭐ Puan: ${stars} (${rating}/5)`),
                para(`📅 Değerlendirme tarihi: ${tarih}`),
                comment ? para(`💬 Yorum: ${comment}`) : null,
              ].filter(Boolean)
            })
          });

          if (appendRes.ok) {
            return res.status(200).json({ ok: true });
          }
        }
      }
    } catch (_) {}
  }

  // No matching page found or no ref — create a standalone evaluation entry
  let titlePropName = 'Name';
  try {
    const dbRes = await fetch(`https://api.notion.com/v1/databases/${dbId}`, { headers });
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      const titleEntry = Object.entries(dbData.properties || {}).find(([, v]) => v.type === 'title');
      if (titleEntry) titlePropName = titleEntry[0];
    }
  } catch (_) {}

  const entryRef = ref || ('DEG-' + Math.random().toString(36).slice(2, 8).toUpperCase());

  const pageBody = {
    parent: { database_id: dbId },
    properties: {
      [titlePropName]: {
        title: [{ text: { content: `Değerlendirme — ${entryRef}` } }],
      },
    },
    children: [
      para(`📋 Referans: ${entryRef}`),
      para(`📅 Tarih: ${tarih}`),
      divider(),
      heading('Müşteri Değerlendirmesi'),
      para(`⭐ Puan: ${stars} (${rating}/5)`),
      comment ? para(`💬 Yorum: ${comment}`) : null,
    ].filter(Boolean),
  };

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify(pageBody),
  });

  if (!notionRes.ok) {
    const errData = await notionRes.json().catch(() => ({}));
    return res.status(500).json({ error: 'Kayıt hatası: ' + (errData.message || notionRes.statusText) });
  }

  return res.status(200).json({ ok: true });
}

function para(text) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

function heading(text) {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}
