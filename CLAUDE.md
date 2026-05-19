# CLAUDE.md — Arel / TEHAŞ Projesi

## Proje Özeti

**TEHAŞ (Teknik Hizmetler Asistanı)** — Burak İsa Sivacı'nın yönettiği saha teknik hizmet işletmesi için geliştirilmiş web uygulaması. Kemalpaşa, İzmir bölgesinde güvenlik kamerası, elektrik tesisatı, uydu, network ve alarm sistemleri kurulum/arıza hizmeti sunar.

**Hedef kitle:** Hizmet alan müşteriler (mobil öncelikli, Türkçe).

**Temel amaçlar:**
- Müşterinin sorununu adım adım wizard akışı ile anlamlandırma (index.html)
- Arıza bildirimini Notion veritabanına kaydetme
- Hizmet sonrası müşteri değerlendirmesi toplama
- Kurumsal bilgi sayfaları (hizmetler, hakkımızda, iletişim)

---

## Dosya Yapısı

```
/
├── index.html              # Ana uygulama — TEHAŞ wizard akışı (arıza bildirimi, adım adım)
├── degerlendirme.html      # Müşteri değerlendirme sayfası (yıldız puanı + yorum)
├── hizmetler.html          # Sunulan hizmetlerin listesi (statik bilgi sayfası)
├── hakkimizda.html         # Hakkımızda / profil sayfası (statik)
├── iletisim.html           # İletişim bilgileri ve harita (statik)
├── arel-koc.html           # Arel Koç — Claude API ile çalışan sohbet asistanı
├── arel.deployer.html      # GitHub'a tek tıkla yayın aracı (geliştirici yardımcısı)
│
├── api/
│   ├── ariza-bildir.js     # Serverless: arıza formunu Notion'a kaydeder
│   ├── degerlendirme.js    # Serverless: müşteri değerlendirmesini Notion'a kaydeder
│   └── bildirim-gonder.js  # Serverless: WhatsApp bildirimi (taslak, henüz aktif değil)
│
├── manifest.json           # PWA manifest (standalone mod, tema rengi #070b14)
├── sw.js                   # Service Worker — offline için uygulama kabuğunu önbelleğe alır
├── icon.svg                # Uygulama ikonu (SVG)
├── icon-maskable.svg       # PWA maskable ikon
├── robots.txt              # SEO — arama robotu direktifleri
├── sitemap.xml             # SEO — site haritası
└── deploy.yml              # GitHub Actions — Vercel otomatik dağıtım workflow'u
```

---

## Tasarım Sistemi

Projede **iki ayrı görsel dil** kullanılır:

### 1. TEHAŞ Uygulama Paleti (index.html, degerlendirme.html)
Koyu mavi-cyan; mobil PWA hissi.

```css
:root {
  /* Arka plan katmanları */
  --bg:    #070b14;   /* En derin arka plan */
  --bg-1:  #0b1120;
  --bg-2:  #0f1729;
  --bg-3:  #141d33;

  /* Çizgiler / kenarlıklar */
  --line:   #1c2740;
  --line-2: #283557;

  /* Metin seviyeleri */
  --t-1: #eef2f9;   /* Birincil metin */
  --t-2: #9aa6c2;   /* İkincil metin */
  --t-3: #5d6b8c;   /* Yardımcı metin */
  --t-4: #3a4566;   /* Soluk metin */

  /* Ana aksanlar */
  --c-cyan:    #34e5c5;
  --c-cyan-d:  #0f7a68;
  --c-cyan-bg: rgba(52,229,197,.08);
  --c-violet:  #a78bfa;

  /* Durum renkleri */
  --c-amber:  #fbbf24;
  --c-orange: #f97316;
  --c-red:    #f87171;
  --c-green:  #22c55e;

  /* Fontlar */
  --f-body: 'Inter', -apple-system, system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;

  /* Animasyon eğrisi */
  --ease: cubic-bezier(.2,.8,.2,1);
}
```

**Bileşen sınıfları (index.html):**

| Sınıf | Açıklama |
|---|---|
| `.app` | Ana kapsayıcı (max-width: 480px, mobil-first) |
| `.hdr` | Yapışkan başlık, blur arka plan |
| `.hdr-brand`, `.hdr-logo`, `.hdr-name` | Logo ve marka alanı |
| `.hdr-status` | Sağ üst durum rozeti (yeşil nokta + "AKTIF") |
| `.stage-bar`, `.stage-progress-fill` | Adım ilerleme çubuğu |
| `.screens`, `.screen`, `.screen.is-on` | Wizard ekran yönetimi |
| `.s-eye` | Ekran üst etiketi (mono, büyük harf, cyan) |
| `.s-h` | Ekran başlığı (30px, weight 600) |
| `.s-p` | Ekran açıklama metni |
| `.choices`, `.choice` | Seçim kartı listesi |
| `.choice.is-on` | Seçili durum (cyan kenarlık + çek işareti) |
| `.choice.compact` | Daha küçük seçim kartı |
| `.choices-grid` | 2 sütunlu seçim ızgarası |
| `.ch-ico`, `.ch-t`, `.ch-s`, `.ch-arr` | Seçim kartı iç öğeleri |
| `.skip-row`, `.back`, `.skip` | Geri/atla navigasyon satırı |
| `.splash`, `.splash-mark` | Karşılama ekranı |
| `.mono` | JetBrains Mono ile metin |
| `.dock` | Alt navigasyon çubuğu |

### 2. Kurumsal Sayfa Paleti (hizmetler.html, hakkimizda.html, iletisim.html)
Koyu altın; masaüstü uyumlu kurumsal tasarım.

```css
:root {
  --gold:       #C9A84C;
  --gold-light: #E8C96A;
  --gold-dim:   rgba(201,168,76,0.12);
  --dark:       #080808;
  --dark2:      #0f0f0f;
  --card:       #111111;
  --gray:       #777;
  --gray2:      #aaa;
  --border:     rgba(255,255,255,0.05);
  --bordergold: rgba(201,168,76,0.15);
  --wa:         #25D366;  /* WhatsApp yeşili */
}
```

Fontlar: **Montserrat** (başlıklar, logo) + **Inter** (gövde metni).

### 3. Arel Koç Paleti (arel-koc.html)
Koyu amber; sohbet arayüzü.

- Arka plan: `#0c0c0c`
- Aksant: `#f59e0b` (amber)
- Fontlar: **Barlow Condensed** (etiketler) + **Barlow** (gövde)

---

## Kodlama Kuralları

- **Vanilla HTML/CSS/JS** — React, Vue, Angular veya başka framework kullanılmaz.
- **Tüm CSS her HTML dosyasının içinde** `<style>` bloğu olarak yer alır; ayrı `.css` dosyası yoktur.
- **Tüm JS her HTML dosyasının içinde** `<script>` bloğu olarak yer alır; ayrı `.js` dosyası yoktur (API handler'ları hariç).
- Ana kullanıcı akışı **yalnızca `index.html`** içinde yaşar. Akışla ilgili yeni özellikler buraya eklenir.
- Mobil öncelikli: `max-width: 480px`, `safe-area` desteği, dokunmatik optimize.
- Sunucu taraflı işlemler **`/api/` klasöründe** Vercel serverless function olarak yazılır (`export default async function handler(req, res)`).
- Vercel fonksiyonları `fetch` API'si kullanır; `node-fetch` veya başka npm paketi eklenmez.

---

## Entegrasyonlar

### Notion
Arıza bildirimleri ve müşteri değerlendirmeleri Notion API'si üzerinden kaydedilir.

| Ortam değişkeni | Açıklama |
|---|---|
| `NOTION_TOKEN` | Notion Integration secret token (zorunlu) |
| `NOTION_DATABASE_ID` | Arıza bildirimi veritabanı ID'si |
| `NOTION_DEGERLENDIRME_DATABASE_ID` | Müşteri değerlendirme veritabanı ID'si (henüz kullanımda değil; `degerlendirme.js` şu an `NOTION_DATABASE_ID`'yi kullanıyor) |

Notion API sürümü: `2022-06-28`

### İmgBB (opsiyonel)
Arıza fotoğrafı yüklemek için kullanılır.

| Ortam değişkeni | Açıklama |
|---|---|
| `IMGBB_API_KEY` | ImgBB API anahtarı (yoksa fotoğraf atlanır) |

### WhatsApp Business API (taslak)
`api/bildirim-gonder.js` içinde tanımlıdır fakat henüz aktif değildir.

| Ortam değişkeni | Açıklama |
|---|---|
| `WHATSAPP_TOKEN` | Meta/WhatsApp Business token |
| `WHATSAPP_PHONE_ID` | WhatsApp Business telefon ID'si |

### Vercel
- `main` branch'e push yapıldığında GitHub Actions (`deploy.yml`) otomatik production deploy tetikler.
- Secrets: `VERCEL_TOKEN`, `ORG_ID`, `PROJECT_ID`

---

## Yapılmaması Gerekenler

- `npm install` ile yeni paket ekleme — proje sıfır bağımlılık ile çalışır.
- React, Vue, Angular veya başka framework kullanma.
- API anahtarı veya token'ı kod içine (hardcode) yazma — tüm sırlar ortam değişkeni olarak tanımlanır.
- Ana kullanıcı akış mantığını `index.html` dışına taşıma.
- Ayrı `.css` veya `.js` dosyası oluşturma (API handler'lar hariç).
- Mevcut CSS değişkenlerini önemsizce değiştirme — renk sistemi tutarlı kalmalı.

---

## Görev Teslim Formatı

Her görevde şu sıra izlenir:

1. **Önce oku** — değiştirilecek dosyayı tam olarak oku.
2. **Minimal değişiklik yap** — sadece istenen özelliği veya düzeltmeyi uygula, çevreleyen kodu yeniden yazma.
3. **Gereksiz yeniden yazımdan kaçın** — çalışan kod dokunulmadan bırakılır.
4. **Stil tutarlılığını koru** — mevcut CSS değişkenlerini ve bileşen sınıflarını kullan.
