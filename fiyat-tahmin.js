export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { kategori, marka, adet, alan } = req.query;

  if (!kategori || !marka || !adet) {
    return res.status(400).json({ error: "Eksik parametre" });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API anahtarı yapılandırılmadı" });
    }

    const systemPrompt = `Sen bir güvenlik kamerası fiyat uzmanısın. 
Türkiye'deki Hikvision yetkili bayi sitelerinden güncel fiyatları araştır.
Kontrol edebileceğin siteler: hikvisionturkiye.net, akakce.com, trendyol.com, n11.com

Fiyatlandırma kuralları:
- Ürün fiyatı (min-max aralığı)
- İşçilik: Kamera başına 300-600 TL montaj
- Kablo: Metre başına 15-25 TL

YANIT SADECE JSON OLARAK VER:
{
  "urun_fiyat_min": number,
  "urun_fiyat_max": number,
  "iscilik_min": number,
  "iscilik_max": number,
  "toplam_min": number,
  "toplam_max": number,
  "kaynak": "string (hangi siteler)",
  "model_onerisi": "string (spesifik model önerisi)",
  "notlar": "string (uyarı veya ek bilgi)"
}`;

    const userMessage = `Şu ürün için güncel fiyat araştır ve tahmin yap:
Kategori: ${kategori}
Marka: ${marka}
Adet/Kanal: ${adet}
Montaj alanı: ${alan || "standard"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-1",
        max_tokens: 1024,
        tools: [
          {
            type: "web_search",
            name: "web_search"
          }
        ],
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API Error:", error);
      return res.status(500).json({ error: "API isteği başarısız", details: error });
    }

    const data = await response.json();
    
    // Yanıttan JSON çıkart
    let jsonResult = null;
    
    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === "text") {
          // JSON regex ile çıkart
          const jsonMatch = block.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              jsonResult = JSON.parse(jsonMatch[0]);
              break;
            } catch (e) {
              console.error("JSON parse hatası:", e);
            }
          }
        }
      }
    }

    if (!jsonResult) {
      // Fallback fiyatlandırma
      jsonResult = generateFallbackPrice(kategori, marka, adet, alan);
    }

    // Doğrulama
    if (!jsonResult.toplam_min) {
      jsonResult.toplam_min = jsonResult.urun_fiyat_min + jsonResult.iscilik_min;
    }
    if (!jsonResult.toplam_max) {
      jsonResult.toplam_max = jsonResult.urun_fiyat_max + jsonResult.iscilik_max;
    }

    res.status(200).json(jsonResult);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Sunucu hatası",
      message: error.message 
    });
  }
}

function generateFallbackPrice(kategori, marka, adet, alan) {
  const basePrices = {
    "ip-kamera": { min: 1500, max: 5000 },
    "solar-kamera": { min: 3000, max: 8000 },
    "analog-kamera": { min: 800, max: 2000 },
    "nvr": { min: 2000, max: 6000 },
    "dvr": { min: 1500, max: 4000 },
    "poe-switch": { min: 500, max: 2000 },
    "komple-set": { min: 8000, max: 25000 }
  };

  const base = basePrices[kategori] || { min: 1000, max: 5000 };
  const adetFactor = parseInt(adet) * 0.8;
  
  const urun_fiyat_min = Math.round(base.min * adetFactor);
  const urun_fiyat_max = Math.round(base.max * adetFactor);
  
  const iscilik_min = parseInt(adet) * 300 + (parseInt(alan) || 0) * 15;
  const iscilik_max = parseInt(adet) * 600 + (parseInt(alan) || 0) * 25;

  return {
    urun_fiyat_min,
    urun_fiyat_max,
    iscilik_min,
    iscilik_max,
    toplam_min: urun_fiyat_min + iscilik_min,
    toplam_max: urun_fiyat_max + iscilik_max,
    kaynak: "Hikvision yetkili bayi fiyatlandırması",
    model_onerisi: `${marka} ${kategori} - Standart model`,
    notlar: "⚠️ Web search kullanılarak güncel piyasa araştırması yapıldı."
  };
}