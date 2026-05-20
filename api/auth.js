// FAZ-1: OTP tabanlı basit kimlik doğrulama
// OTP'ler bellekte tutulur — cold start'ta sıfırlanır, FAZ-1 için yeterli.
// FAZ-2'de kalıcı depolama (Notion veya KV) ile değiştirilecek.

const OTP_TTL = 10 * 60 * 1000; // 10 dakika
const otpStore = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, telefon, otp } = req.body || {};

  if (action === 'send') {
    if (!telefon) return res.status(400).json({ error: 'Telefon numarası gerekli.' });

    const telRaw = String(telefon).replace(/\D/g, '');
    if (telRaw.length < 10) return res.status(400).json({ error: 'Geçerli telefon numarası girin.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(telRaw, { code, expires: Date.now() + OTP_TTL });

    // Production: WhatsApp/SMS entegrasyonu buraya — FAZ-2'de eklenecek
    console.log(`[AUTH] OTP ${telRaw}: ${code}`);

    return res.status(200).json({ ok: true, message: 'Doğrulama kodu gönderildi.' });
  }

  if (action === 'verify') {
    if (!telefon || !otp) return res.status(400).json({ error: 'Telefon ve kod gerekli.' });

    const telRaw = String(telefon).replace(/\D/g, '');
    const stored = otpStore.get(telRaw);

    if (!stored || Date.now() > stored.expires) {
      otpStore.delete(telRaw);
      return res.status(400).json({ error: 'Kod süresi dolmuş veya geçersiz.' });
    }

    if (stored.code !== String(otp).trim()) {
      return res.status(400).json({ error: 'Geçersiz doğrulama kodu.' });
    }

    otpStore.delete(telRaw);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Sunucu yapılandırma hatası. JWT_SECRET eksik.' });
    }

    // Basit oturum token'ı (JWT kütüphanesi gerektirmez, Node 18+ Web Crypto)
    const sessionId = crypto.randomUUID();
    const payload = { tel: telRaw, sid: sessionId, iat: Math.floor(Date.now() / 1000) };
    const token = await signToken(payload, jwtSecret);

    return res.status(200).json({ ok: true, token });
  }

  return res.status(400).json({ error: 'Geçersiz işlem. action: "send" veya "verify" olmalı.' });
}

async function signToken(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const body = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const unsigned = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${unsigned}.${sigB64}`;
}
