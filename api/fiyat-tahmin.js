// FAZ-1: Statik fiyat tahmini
// Bölge ve hizmet türüne göre ₺ aralığı döndürür.
// Gerçek fiyatlar sahada tespit sonrası netleşir.

const FIYAT = {
  kamera:   { ariza: [300, 800],   bakim: [200, 500],  kurulum: [800, 3500]  },
  elektrik: { ariza: [250, 600],   bakim: [300, 700],  kurulum: [500, 2500]  },
  anten:    { ariza: [200, 500],   bakim: [150, 350],  kurulum: [400, 1200]  },
  network:  { ariza: [300, 700],   bakim: [200, 500],  kurulum: [600, 2000]  },
  alarm:    { ariza: [300, 700],   bakim: [200, 450],  kurulum: [700, 2500]  },
};

const ACIKLAMA = {
  kamera:   { ariza: 'Kamera arıza tespiti ve onarım', bakim: 'Kamera temizleme ve bakım', kurulum: 'Kamera kurulum (kamera hariç)' },
  elektrik: { ariza: 'Elektrik arıza tespiti ve onarım', bakim: 'Elektrik kontrol ve bakım', kurulum: 'Elektrik tesisat kurulumu' },
  anten:    { ariza: 'Anten arıza tespiti ve onarım', bakim: 'Anten ayarlama ve bakım', kurulum: 'Anten / çanak kurulumu' },
  network:  { ariza: 'Ağ arıza tespiti ve onarım', bakim: 'Ağ kontrol ve bakım', kurulum: 'Ağ altyapısı kurulumu' },
  alarm:    { ariza: 'Alarm sistemi arıza onarımı', bakim: 'Alarm sistemi bakımı', kurulum: 'Alarm sistemi kurulumu' },
};

const BOLGE_CARPAN = {
  kemalpasa: 1.0,
  armutlu:   1.0,
  osb:       1.15,
  izmir:     1.25,
  diger:     1.1,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { hizmet, tip = 'ariza', bolge = 'kemalpasa' } = req.body || {};

  if (!hizmet || !FIYAT[hizmet]) {
    return res.status(400).json({
      error: 'Geçerli hizmet türü gerekli.',
      gecerli: Object.keys(FIYAT),
    });
  }

  const tipNorm = FIYAT[hizmet][tip] ? tip : 'ariza';
  const [minBase, maxBase] = FIYAT[hizmet][tipNorm];
  const carpan = BOLGE_CARPAN[bolge] || 1.0;

  return res.status(200).json({
    ok: true,
    hizmet,
    tip: tipNorm,
    bolge,
    min: Math.round(minBase * carpan),
    max: Math.round(maxBase * carpan),
    aciklama: ACIKLAMA[hizmet][tipNorm],
    not: 'Fiyat tahminidir. Kesin fiyat yerinde tespite göre belirlenir.',
    para: 'TRY',
  });
}
