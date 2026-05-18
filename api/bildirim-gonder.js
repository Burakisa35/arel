/**
 * TASLAK — "Teknisyen yolda" bildirimi
 *
 * Şu an aktif değil; WhatsApp Business API entegrasyonu hazırlandığında
 * ilgili bölüm açılmalı ve WHATSAPP_TOKEN ortam değişkeni tanımlanmalıdır.
 *
 * Kullanım:
 *   POST /api/bildirim-gonder
 *   { "telefon": "05xxxxxxxxx", "mesaj": "Teknisyenimiz yola çıktı." }
 *
 * Yanıt (şu an taslak modu):
 *   { "ok": true, "mod": "taslak", "link": "https://wa.me/90..." }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { telefon, mesaj } = req.body || {};

  if (!telefon || !mesaj) {
    return res.status(400).json({ error: 'telefon ve mesaj alanları zorunludur.' });
  }

  // Telefonu normalleştir (0 ile başlıyorsa 90 ekle)
  const telRaw = String(telefon).replace(/\D/g, '');
  const tel90 = telRaw.startsWith('90') ? telRaw
    : telRaw.startsWith('0') ? '9' + telRaw
    : '90' + telRaw;

  // ─── WhatsApp Business API (şu an devre dışı) ─────────────────────
  //
  // const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  // const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
  //
  // if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
  //   const waRes = await fetch(
  //     `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         messaging_product: 'whatsapp',
  //         to: tel90,
  //         type: 'text',
  //         text: { body: mesaj },
  //       }),
  //     }
  //   );
  //   if (!waRes.ok) {
  //     const err = await waRes.json().catch(() => ({}));
  //     return res.status(500).json({ error: 'WhatsApp gönderilemedi: ' + (err.message || waRes.statusText) });
  //   }
  //   return res.status(200).json({ ok: true, mod: 'whatsapp' });
  // }
  // ──────────────────────────────────────────────────────────────────

  // Taslak modu: WhatsApp linki üret (teknisyen manuel gönderir)
  const waLink = 'https://wa.me/' + tel90 + '?text=' + encodeURIComponent(mesaj);

  return res.status(200).json({
    ok: true,
    mod: 'taslak',
    link: waLink,
    mesaj: `WhatsApp Business API aktif değil. Aşağıdaki linki kullanarak mesajı manuel gönderin:\n${waLink}`,
  });
}
