export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { kategori, marka, adet, alan } = req.body || {};
  if (!kategori || !marka || !adet) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Sen bir güvenlik kamerası fiyat uzmanısın.
Türkiye'deki güvenlik kamerası satıcı sitelerinden güncel fiyatları araştır.
Araştır: akakce.com, trendyol.com, n11.com, hepsiburada.com
İşçilik maliyetini de hesapla: kamera başına 300-600 TL montaj + kablo metre başına 15-25 TL.
Yanıtı SADECE JSON olarak ver, başka hiçbir şey yazma:
{
  "urun_fiyat_min": number,
  "urun_fiyat_max": number,
  "iscilik_min": number,
  "iscilik_max": number,
  "toplam_min": number,
  "toplam_max": number,
  "kaynak": "string (hangi sitelerden fiyat alındı)",
  "model_onerisi": "string (spesifik model adı)",
  "notlar": "string (varsa önemli uyarı, yoksa boş string)"
}`,
        messages: [{
          role: 'user',
          content: `Şu ürün için güncel fiyat araştır ve tahmin yap:
Kategori: ${kategori}
Marka: ${marka}
Adet/Kanal: ${adet}
Montaj alanı: ${alan || 'belirtilmedi'}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: 'AI hatası: ' + (err.error?.message || response.statusText) });
    }

    const data = await response.json();

    // Extract text from the last text content block
    let jsonText = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') jsonText = block.text;
    }

    // Parse JSON — strip any markdown fences if present
    const cleaned = jsonText.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error('fiyat-tahmin error:', e);
    return res.status(500).json({ error: e.message || 'Bilinmeyen hata' });
  }
}
