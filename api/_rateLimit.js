// Memory Map ile IP başına istek takibi
// Pencere: 60 saniye, limit: 10 istek
// Serverless cold start'ta sıfırlanır — FAZ-1 için yeterli.

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const ratemap = new Map();

/**
 * @returns {boolean} true → limit aşıldı, response gönderildi; false → devam et
 */
export default function rateLimit(req, res) {
  const ip  = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ratemap.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW_MS) {
    ratemap.set(ip, { count: 1, start: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Çok fazla istek. Lütfen bekleyin.' });
    return true;
  }

  ratemap.set(ip, { count: entry.count + 1, start: entry.start });
  return false;
}
