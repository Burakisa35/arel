// ─── TEHAŞ Teklif Hesap Motoru ───────────────────────────────────
// Sunucu tarafı (api/ içi) ve admin.html'de inline olarak kullanılır.

/**
 * DVR kanal önerisi — %80 doluluk eşiğini aşmamak üzere bir üst kanala geçer.
 */
export function calcDVR(camCount) {
  const tiers = [4, 8, 16, 32];
  for (const ch of tiers) {
    if (camCount <= ch && camCount / ch <= 0.8) {
      return { channel: ch };
    }
    // Doluluk > %80 ise bir sonraki tier'a geç
  }
  return { channel: 32, note: '2×cihaz gerekebilir' };
}

/**
 * HDD kapasitesi — çözünürlük katsayısı, kayıt süresi ve ses.
 * @returns {number} GB cinsinden tavsiye edilen HDD boyutu
 */
export function calcHDD(camCount, resolutionMp, days, hasAudio = false) {
  const coeffs = { 2: 0.3, 4: 0.5, 5: 0.7, 8: 1.2 };
  const coeff   = coeffs[resolutionMp] ?? 0.5;
  const daily   = camCount * coeff * 24 * 0.5;           // %50 hareket katsayısı
  const total   = daily * days * (hasAudio ? 1.15 : 1);  // GB
  const sizes   = [1000, 2000, 4000, 6000, 8000, 10000];
  return sizes.find(s => s >= total) ?? 10000;
}

/**
 * İşçilik adam-gün hesabı.
 */
export function calcLabor(camCount, isOutdoor, cableMeters, hasDVRSetup) {
  let base = camCount * 1.5;
  if (isOutdoor)       base *= 1.3;
  if (cableMeters > 100) base += 2;
  if (hasDVRSetup)     base += 1;
  return Math.ceil(base);
}

/**
 * Bölgeye göre yol maliyeti (₺).
 */
export function calcTravel(region) {
  const tablo = {
    armutlu:  0,
    kemalpasa: 150,
    osb:      300,
    izmir:    500,
    uzak:     750,
  };
  return tablo[region] ?? 500;
}

/**
 * 3 fiyat katmanı üretir.
 * @param {number} totalCost — maliyet toplamı
 */
export function calcTiers(totalCost) {
  const tier = (label, multiplier) => ({
    label,
    multiplier,
    price: Math.ceil((totalCost * multiplier) / 100) * 100,
  });
  return {
    ekonomik: tier('Ekonomik', 1.25),
    standart: tier('Standart', 1.45),
    guclu:    tier('Güçlü',    1.65),
  };
}

/**
 * Teklif doğrulama — kaydetmeden önce çalıştırılır.
 * @param {Array}  items   — [{name, unit_price, item_type, quantity}]
 * @param {Object} summary — {camCount, channel, hasHDD, adminPrice, totalCost, region}
 */
export function validateQuote(items, summary) {
  const errors   = [];
  const warnings = [];

  // Fiyatsız ürün kontrolü
  for (const item of items) {
    if (!item.unit_price || item.unit_price === 0) {
      errors.push(`Fiyatsız ürün var: ${item.name}`);
    }
  }

  // DVR kanal kontrolü
  if (summary.channel && summary.camCount) {
    if (summary.channel / summary.camCount < 0.8) {
      errors.push('DVR kanal sayısı kamera adedine göre yetersiz');
    }
  }

  // HDD kontrolü
  const hasHDD = items.some(i => i.item_type === 'hdd');
  if (!hasHDD) errors.push('HDD eklenmedi');

  // İşçilik kontrolü
  const laborItem = items.find(i => i.item_type === 'labor');
  if (!laborItem || laborItem.unit_price === 0) {
    errors.push('İşçilik satırı eksik veya sıfır');
  }

  // Uyarılar
  if (!summary.region) {
    warnings.push('Bölge / yol maliyeti seçilmedi');
  }
  const accessories = items.filter(i => i.item_type === 'accessory');
  if (accessories.length === 0) {
    warnings.push('Yardımcı malzeme eklenmedi');
  }
  if (summary.adminPrice && summary.totalCost) {
    const margin = (summary.adminPrice - summary.totalCost) / summary.adminPrice;
    if (margin < 0.15) {
      warnings.push('Kâr marjı %15 altında');
    }
  }

  return { errors, warnings, canSave: errors.length === 0 };
}
