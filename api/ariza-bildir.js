export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, tel, adres, aciklama, photo } = req.body || {};

  if (!name || !tel || !adres || !aciklama) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
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

  // Find title property name in the database schema
  let titlePropName = 'Name';
  try {
    const dbRes = await fetch(`https://api.notion.com/v1/databases/${dbId}`, { headers });
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      const titleEntry = Object.entries(dbData.properties || {}).find(([, v]) => v.type === 'title');
      if (titleEntry) titlePropName = titleEntry[0];
    }
  } catch (_) {}

  const ref = 'AB-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const tarih = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  const blocks = [
    para(`📋 Referans: ${ref}`),
    para(`📅 Tarih: ${tarih}`),
    divider(),
    heading(`İletişim Bilgileri`),
    para(`👤 Ad Soyad: ${name}`),
    para(`📞 Telefon: ${tel}`),
    para(`📍 Adres: ${adres}`),
    divider(),
    heading('Açıklama'),
    para(aciklama),
    divider(),
    para(`📷 Fotoğraf: ${photo ? `Eklendi — ${photo.name} (${Math.round((photo.size || 0) / 1024)} KB)` : 'Eklenmedi'}`),
  ];

  // Upload photo to imgbb if API key is configured
  if (photo && photo.base64 && process.env.IMGBB_API_KEY) {
    try {
      const base64Only = photo.base64.includes(',') ? photo.base64.split(',')[1] : photo.base64;
      const form = new URLSearchParams();
      form.append('key', process.env.IMGBB_API_KEY);
      form.append('image', base64Only);
      form.append('name', (photo.name || 'ariza').replace(/\.[^.]+$/, ''));

      const imgRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
      const imgData = await imgRes.json();
      if (imgData.success && imgData.data && imgData.data.url) {
        blocks.push({
          object: 'block',
          type: 'image',
          image: { type: 'external', external: { url: imgData.data.url } },
        });
      }
    } catch (_) {}
  }

  const pageBody = {
    parent: { database_id: dbId },
    properties: {
      [titlePropName]: {
        title: [{ text: { content: `Arıza — ${name} · ${ref}` } }],
      },
    },
    children: blocks,
  };

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify(pageBody),
  });

  if (!notionRes.ok) {
    const errData = await notionRes.json().catch(() => ({}));
    console.error('Notion error:', JSON.stringify(errData));
    return res.status(500).json({ error: 'Kayıt hatası: ' + (errData.message || notionRes.statusText) });
  }

  return res.status(200).json({ ok: true, ref });
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
