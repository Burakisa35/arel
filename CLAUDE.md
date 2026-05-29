# CLAUDE.md — Arel / TEHAŞ Projesi

## Proje Özeti

**TEHAŞ (Teknik Hizmetler Asistanı)** — Burak İsa Sivacı'nın yönettiği saha teknik hizmet işletmesi için geliştirilmiş web uygulaması. Kemalpaşa, İzmir bölgesinde güvenlik kamerası, elektrik tesisatı, uydu, network ve alarm sistemleri kurulum/arıza hizmeti sunar.

**Hedef kitle:** Hizmet alan müşteriler (mobil öncelikli, Türkçe).

**Production URL:** `https://arel-phi.vercel.app/`

**Admin WhatsApp:** `905367807059` — Bu numara birden fazla statik HTML dosyasına hardcode edilmiştir. Değişirse şu dosyalar elle güncellenmelidir: `api/durum-sorgula.js`, `fiyat.html`, `teknisyen.html`, `hakkimizda.html` (2 yer), `hizmetler.html` (7 yer), `iletisim.html` (3 yer).

---

## Dosya Yapısı

```
/
├── index.html              # Ana uygulama — 11 adımlı arıza/talep wizard akışı (PWA)
├── degerlendirme.html      # Müşteri değerlendirme sayfası (yıldız puanı + yorum)
├── fiyat.html              # Fiyat tahmini sayfası — hizmet/bölge seçimli form
├── teknisyen.html          # Teknisyen çağır — doğrudan randevu akışı
├── user.html               # Kullanıcı paneli (OTP giriş + talep geçmişi — FAZ-2 iskeleti)
├── hizmetler.html          # Sunulan hizmetlerin listesi (statik)
├── hakkimizda.html         # Hakkımızda / profil sayfası (statik)
├── iletisim.html           # İletişim bilgileri ve harita (statik)
├── gizlilik.html           # Gizlilik politikası / KVKK metni (statik)
│
├── api/
│   ├── _rateLimit.js       # Paylaşılan rate limiter (60s / 10 istek / IP — bellek tabanlı)
│   ├── ariza-bildir.js     # Serverless: arıza formunu Notion'a kaydeder (AKTİF)
│   ├── degerlendirme.js    # Serverless: müşteri değerlendirmesini Notion'a kaydeder (AKTİF)
│   ├── fiyat-tahmin.js     # Serverless: hizmet/bölge bazlı statik fiyat aralığı döndürür (AKTİF)
│   ├── durum-sorgula.js    # Frontend HTML sayfası (yanlış konum — backend henüz yok, TASLAK)
│   ├── auth.js             # Serverless: OTP gönder/doğrula + JWT üretimi (FAZ-2, aktif değil)
│   ├── inventory.js        # Serverless: Envanter placeholder — 501 döner (FAZ-2)
│   └── bildirim-gonder.js  # Serverless: WhatsApp bildirimi (taslak, taslak mod linki döner)
│
├── lib/
│   └── db.js               # Paylaşılan Notion yardımcıları (notionHeaders, createPage, para, heading, divider)
│
├── auth.js                 # KULLANILMIYOR — eski Vercel Postgres tabanlı auth taslağı
├── db.js                   # KULLANILMIYOR — eski Vercel Postgres tabanlı db taslağı
├── inventory.js            # KULLANILMIYOR — eski taslak
├── fiyat-tahmin.js         # KULLANILMIYOR — eski taslak
│
├── manifest.json           # PWA manifest (standalone mod, tema rengi #070b14, lang: tr)
├── sw.js                   # Service Worker — app shell önbelleği; /api/ asla önbelleğe alınmaz
├── icon.svg                # Uygulama ikonu (SVG)
├── icon-maskable.svg       # PWA maskable ikon
├── favicon.svg             # Favicon (icon.svg'den ayrı)
├── robots.txt              # SEO — arama robotu direktifleri
├── sitemap.xml             # SEO — site haritası
├── .env.example            # Ortam değişkeni referans dosyası (gerçek değerler olmadan)
│
├── deploy.yml              # GitHub Actions — Vercel production deploy (main'e push'ta)
└── .github/
    └── workflows/
        ├── claude.yml              # @claude etiketleme ile tetiklenen Claude Code action
        └── claude-code-review.yml  # PR açıldığında otomatik Claude code review
```

> **`api/durum-sorgula.js` notu:** Bu dosya aslında bir frontend HTML sayfasıdır (`<!DOCTYPE html>` ile başlar). Doğru konumu `durum-sorgula.html` olmalıdır. İçindeki JS `/api/durum-sorgula`'ya fetch yapar ama o backend henüz uygulanmamıştır.

> **Root-level `auth.js`, `db.js`, `inventory.js`, `fiyat-tahmin.js`:** Eski Vercel Postgres tabanlı taslaklar. `api/` altındaki sürümlerle çakışır — düzenlenmeli.

---

## Wizard Akışı (index.html)

`FLOW` dizisi 13 ekran tanımlar. `state.idx` FLOW'daki konumu izler.

| `FLOW` indeksi | `data-screen` | Adım | Açıklama |
|---|---|---|---|
| 0 | `splash` | — | Karşılama: Sorunum Var / Fiyat / Teknik Destek / Teknisyen Çağır |
| 1 | `problem` | 01 · Problem | 10 problem seçeneği (kamera×3, network, elektrik×3, otomasyon, kurulum, keşif) |
| 2 | `userType` | 02 · Profil | Bireysel / Kurumsal / Tarım / Diğer |
| 3 | `region` | 03 · Konum | Kemalpaşa / Armutlu / OSB / Köy / İzmir / Uzak |
| 4 | `behavior` | 04 · Durum | Hiç çalışmıyor / Kısmen / Hata / Tuhaf / Emin değilim |
| 5 | `impact` | 05 · Etki | Tek cihaz / Bölge / Tüm sistem |
| 6 | `when` | 06 · Zaman | Bugün / Dün / Birkaç gün / Uzun süredir |
| 7 | `urgency` | 07 · Uygunluk | Acil / Yarın / 2-3 gün / Bu hafta / Esnek |
| 8 | `slot` | 08 · Saat | Sabah / Öğle / Öğleden sonra / Akşam |
| 9 | `info` | 09 · İletişim | Ad Soyad + Telefon (zorunlu) + Not (opsiyonel) |
| 10 | `summary` | 10 · Özet | Tüm seçimlerin özet tablosu |
| 11 | `contact` | 11 · Onay | Onay butonu → `handleConfirm()` |
| 12 | `done` | — | Başarı ekranı + REF numarası (TH-XXXXXX formatı) |
| — | `ariza-form` | — | Teknik destek talebi formu (wizard dışı akış, splash'tan açılır) |
| — | `ariza-done` | — | Arıza bildirimi başarı ekranı (REF: AB-XXXXXX) |

**Önemli davranışlar:**
- **Session yönetimi:** `sessionStorage` key `tehas_flow` — sayfa yenilenince kaldığı adımdan devam eder.
- **Otomatik ilerleme:** Seçim kartına tıklandığında 220ms gecikme sonra `next()` çağrılır.
- **handleConfirm:** Optimistic UX — önce `goto('done')` çağrılır, ardından arka planda `/api/ariza-bildir`'e POST yapılır (hata sessizce yutulur).
- **Telefon formatı:** Türkiye formatı — `5xxx xxx xx xx`, başına 0 veya 90 olmadan, 10 basamak.
- **Klavye:** Enter → ileri, Escape → geri.
- **CAT_MAP:** Problem seçiminde `data-cat` atribütü ile `state.data._cat` otomatik dolar.

---

## Tasarım Sistemi

Projede **dört farklı görsel dil** kullanılır. Yeni sayfa oluştururken en yakın mevcut paletini kopyala.

### 1. TEHAŞ Wizard Paleti — Blue (index.html)
Koyu lacivert-mavi; güncel ana akış sayfası. Mavi vurgu rengi.

```css
:root {
  --bg: #050a18;  --bg-1: #0a1628;  --bg-2: #0f1f3a;  --bg-3: #152444;
  --line: #1a2d4a;  --line-2: #243d64;
  --t-1: #f0f4ff;   --t-2: #8da4c8;   --t-3: #4d6180;   --t-4: #2d3f58;
  --c-blue:      #3b82f6;
  --c-blue-d:    #1d4ed8;
  --c-blue-bg:   rgba(59,130,246,.08);
  --c-blue-glow: rgba(59,130,246,.25);
  --c-chrome:    #94a3b8;
  --c-green:     #22c55e;
  --c-amber:     #fbbf24;
  --c-red:       #f87171;
  --c-violet:    #818cf8;
  --f-body: 'Inter', -apple-system, system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --ease: cubic-bezier(.2,.8,.2,1);
}
```

### 2. TEHAŞ Uygulama Paleti — Cyan (fiyat.html, teknisyen.html, degerlendirme.html)
Koyu mavi-cyan; mobil PWA hissi. Cyan/teal vurgu rengi.

```css
:root {
  --bg: #070b14;  --bg-1: #0b1120;  --bg-2: #0f1729;  --bg-3: #141d33;
  --line: #1c2740;  --line-2: #283557;
  --t-1: #eef2f9;   --t-2: #9aa6c2;   --t-3: #5d6b8c;   --t-4: #3a4566;
  --c-cyan:    #34e5c5;
  --c-cyan-d:  #0f7a68;
  --c-cyan-bg: rgba(52,229,197,.08);
  --c-violet:  #a78bfa;
  --c-amber:   #fbbf24;
  --c-green:   #22c55e;
  --c-red:     #f87171;
  --f-body: 'Inter', -apple-system, system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --ease: cubic-bezier(.2,.8,.2,1);
}
```

### 3. Kurumsal Sayfa Paleti (hizmetler.html, hakkimizda.html, iletisim.html, gizlilik.html)
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
  --wa:         #25D366;
}
```

Fontlar: **Montserrat** (başlıklar, logo) + **Inter** (gövde metni).

### 4. Kullanıcı Paneli Paleti (user.html, durum-sorgula)
Koyu mavi; Syne başlık fontu + IBM Plex Mono.

```css
:root {
  --bg: #050c1a;  --bg-1: #091422;  --bg-2: #0d1c30;
  --line: #162336;  --line-2: #1e3050;
  --t-1: #eaf0ff;   --t-2: #7c9cbf;   --t-3: #3f5a7a;   --t-4: #253548;
  --blue: #3b82f6;  --blue-dim: rgba(59,130,246,.10);
  --green: #34d399;  --cyan: #34d399;  --violet: #a78bfa;
  --mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  --head: 'Syne', system-ui, sans-serif;
  --ease: cubic-bezier(.22,.8,.2,1);
}
```

---

## Bileşen Sınıfları (index.html)

| Sınıf | Açıklama |
|---|---|
| `.app` | Ana kapsayıcı (max-width: 480px, mobil-first) |
| `.hdr` | Yapışkan başlık, blur arka plan |
| `.hdr-brand`, `.hdr-logo`, `.hdr-name`, `.hdr-sub` | Logo ve marka alanı |
| `.hdr-status`, `.hdr-dot` | Sağ üst durum rozeti (yeşil nokta + "Çevrimiçi") |
| `.stage-bar`, `.stage-progress-fill` | Adım ilerleme çubuğu |
| `.screens`, `.screen`, `.screen.is-on` | Wizard ekran yönetimi |
| `.s-eye` | Ekran üst etiketi (mono, büyük harf, blue) |
| `.s-h` | Ekran başlığı (28px, weight 600) |
| `.s-p` | Ekran açıklama metni |
| `.choices`, `.choice` | Seçim kartı listesi |
| `.choice.is-on` | Seçili durum (blue kenarlık + çek işareti) |
| `.choice.compact` | Daha küçük seçim kartı (.ch-s gizlenir) |
| `.choices-grid` | 2 sütunlu seçim ızgarası |
| `.ch-ico`, `.ch-body`, `.ch-t`, `.ch-s`, `.ch-arr` | Seçim kartı iç öğeleri |
| `.op-card`, `.op-card.is-primary` | Splash ekranı aksiyon kartları |
| `.op-ico`, `.op-body`, `.op-t`, `.op-s`, `.op-arr`, `.op-badge` | Op card iç öğeleri |
| `.op-divider` | Op card grupları arası ayırıcı |
| `.ecosystem`, `.brand-pill` | Teknik ekosistem (marka rozeti satırı) |
| `.field`, `.field label` | Form alan wrapper + etiketi |
| `.sum-card`, `.sum-list`, `.sum-row`, `.sum-k`, `.sum-v` | Özet tablosu |
| `.sum-status` | Özet altındaki durum bilgisi çubuğu |
| `.confirm-btn` | Onay butonu (blue, min-height: 56px) |
| `.ariza-submit` | Arıza gönder butonu (amber renk) |
| `.ariza-back`, `.ariza-done`, `.ariza-done-ref` | Arıza form iç bileşenleri |
| `.done`, `.done-mark`, `.done-ref`, `.done-back` | Başarı ekranı bileşenleri |
| `.form-err`, `.form-err.is-vis` | Hata mesajı kutusu (is-vis ile görünür) |
| `.skip-row` | Geri/atla navigasyon satırı |
| `.splash`, `.splash-mark`, `.splash-foot` | Karşılama ekranı bileşenleri |
| `.dock`, `.dock-cta`, `.dock-back`, `.dock-ctx`, `.dock-eye`, `.dock-l` | Alt sabit navigasyon |
| `.file-field`, `.file-input-wrap`, `.file-preview` | Fotoğraf yükleme alanı |

---

## API Endpoint'leri

| Endpoint | Dosya | Durum | Method | Açıklama |
|---|---|---|---|---|
| `POST /api/ariza-bildir` | `api/ariza-bildir.js` | **AKTİF** | POST | Arıza bildirimi Notion'a kaydet |
| `POST /api/degerlendirme` | `api/degerlendirme.js` | **AKTİF** | POST | Müşteri değerlendirmesi kaydet / mevcut sayfayı güncelle |
| `POST /api/fiyat-tahmin` | `api/fiyat-tahmin.js` | **AKTİF** | POST | Hizmet/bölge bazlı fiyat aralığı döndür |
| `GET /api/durum-sorgula` | *(eksik)* | **TASLAK** | GET | REF / kimlik ile talep durumu — backend uygulanmamış |
| `POST /api/auth` | `api/auth.js` | **FAZ-2** | POST | OTP gönder (`action: "send"`) + doğrula (`action: "verify"`) |
| `POST /api/bildirim-gonder` | `api/bildirim-gonder.js` | **TASLAK** | POST | WhatsApp bildirimi (şu an wa.me linki döner) |
| `/api/inventory` | `api/inventory.js` | **FAZ-2** | — | 501 döner |

### ariza-bildir istek gövdesi
```json
{ "name": "string", "tel": "string", "adres": "string", "aciklama": "string",
  "photo": { "base64": "data:image/...", "name": "dosya.jpg", "type": "image/jpeg", "size": 1024 } }
```

### fiyat-tahmin istek gövdesi
```json
{ "hizmet": "kamera|elektrik|anten|network|alarm",
  "tip": "ariza|bakim|kurulum",
  "bolge": "kemalpasa|armutlu|osb|izmir|diger" }
```

### degerlendirme istek gövdesi
```json
{ "ref": "TH-XXXXXX", "rating": 1-5, "comment": "string (opsiyonel)" }
```

### auth istek gövdesi
```json
{ "action": "send", "telefon": "05xxxxxxxxx" }
{ "action": "verify", "telefon": "05xxxxxxxxx", "otp": "123456" }
```

---

## Paylaşılan Yardımcı Modüller

### `api/_rateLimit.js`
Bellek tabanlı, IP başına rate limiter. **Tüm aktif API handler'larına eklenmiş olmalı.**
- Pencere: 60 saniye, limit: 10 istek/IP
- Cold start'ta sıfırlanır (Vercel serverless — FAZ-1 için yeterli)
- `if (rateLimit(req, res)) return;` şeklinde handler başına eklenir

### `lib/db.js`
Notion API paylaşılan yardımcıları. Yeni serverless fonksiyonlar inline tekrar yazmak yerine buradan import etmeli:
- `notionHeaders(token)` → Notion API başlıkları objesi
- `getTitlePropName(dbId, token)` → Veritabanındaki title property adını bulur
- `createPage(dbId, token, titlePropName, title, children)` → Notion'a sayfa oluşturur
- `para(text)`, `heading(text)`, `divider()` → Notion block oluşturucular

---

## Entegrasyonlar

### Notion (Zorunlu)

| Ortam değişkeni | Açıklama |
|---|---|
| `NOTION_TOKEN` | Notion Integration secret token |
| `NOTION_DATABASE_ID` | Arıza bildirimi VE şu an değerlendirme veritabanı ID'si |
| `NOTION_DEGERLENDIRME_DATABASE_ID` | Tanımlı ama `degerlendirme.js` şu an `NOTION_DATABASE_ID`'yi kullanıyor |

Notion API sürümü: `2022-06-28`

### İmgBB (Opsiyonel)

| Ortam değişkeni | Açıklama |
|---|---|
| `IMGBB_API_KEY` | Arıza fotoğrafı yükleme için (yoksa fotoğraf adımı atlanır, form çalışır) |

### Auth / JWT (FAZ-2 — Aktif Değil)

| Ortam değişkeni | Açıklama |
|---|---|
| `JWT_SECRET` | En az 32 karakter rastgele anahtar; eksikse `api/auth.js` kasıtlı 500 döner |
| `ALLOWED_ORIGIN` | CORS origin kısıtı; tanımlanmazsa `*` geçerli |

### WhatsApp Business API (Taslak)

| Ortam değişkeni | Açıklama |
|---|---|
| `WHATSAPP_TOKEN` | Meta/WhatsApp Business token |
| `WHATSAPP_PHONE_ID` | WhatsApp Business telefon ID'si |

### Vercel (Deployment)
- `main` branch'e push → `deploy.yml` → `amondnet/vercel-action@v25` → production deploy
- Secrets: `VERCEL_TOKEN`, `ORG_ID`, `PROJECT_ID`

---

## GitHub Actions Workflows

| Dosya | Tetikleyici | Ne yapar |
|---|---|---|
| `deploy.yml` (repo kökü) | `main` branch'e push | Vercel production deploy |
| `.github/workflows/claude.yml` | Issue/PR yorum/review'da `@claude` etiketi | Claude Code action çalıştırır |
| `.github/workflows/claude-code-review.yml` | PR açılınca / güncellenince | Otomatik code review (`/code-review` skill) |

---

## PWA Yapısı

- `manifest.json`: `name: "Arel"`, `short_name: "Arel"`, `display: "standalone"`, `lang: "tr"`
- `sw.js` (`CACHE_NAME: 'arel-v1'`): App shell önbelleği — index, manifest, ikonlar, degerlendirme.html
  - `/api/*` istekleri asla önbelleğe alınmaz
  - Offline navigasyon istekleri `index.html` döner
- iOS meta tagları: `apple-mobile-web-app-capable`, `black-translucent` status bar

---

## Geliştirme Aşamaları

**FAZ-1 (Tamamlandı):**
- 11 adımlı wizard akışı (index.html)
- Arıza bildirimi → Notion (ariza-bildir.js)
- Müşteri değerlendirmesi (degerlendirme.js)
- Fiyat tahmini (fiyat-tahmin.js + fiyat.html)
- Teknisyen çağırma akışı (teknisyen.html)
- Rate limiting (_rateLimit.js)
- PWA + Service Worker
- Güvenlik: ortam değişkeni temizleme, .env.example, rate limit

**FAZ-2 (Planlandı):**
- OTP tabanlı kullanıcı girişi (api/auth.js iskeleti hazır; WhatsApp/SMS entegrasyonu eksik)
- Kullanıcı paneli — talep geçmişi (user.html iskeleti hazır)
- Talep durumu sorgulama backend'i (frontend sayfası `api/durum-sorgula.js`'de var, backend yok)
- Envanter yönetimi (api/inventory.js → şu an 501)
- WhatsApp Business API aktivasyonu

---

## Kodlama Kuralları

- **Vanilla HTML/CSS/JS** — React, Vue, Angular veya başka framework kullanılmaz.
- **Tüm CSS her HTML dosyasının içinde** `<style>` bloğu olarak yer alır; ayrı `.css` dosyası yoktur.
- **Tüm JS her HTML dosyasının içinde** `<script>` bloğu olarak yer alır; ayrı `.js` dosyası yoktur (API handler'ları ve `lib/` hariç).
- Ana kullanıcı akışı **yalnızca `index.html`** içinde yaşar. Akışla ilgili yeni özellikler buraya eklenir.
- Mobil öncelikli: `max-width: 480px`, `safe-area` desteği (`env(safe-area-inset-*)`), dokunmatik optimize.
- Sunucu taraflı işlemler **`/api/` klasöründe** Vercel serverless function olarak yazılır (`export default async function handler(req, res)`).
- Vercel fonksiyonları `fetch` API'si kullanır; `node-fetch` veya başka npm paketi eklenmez.
- Yeni API handler'larına her zaman `_rateLimit.js` ve CORS başlıkları ekle.
- Notion işlemleri için `lib/db.js` yardımcılarını inline tekrar yazmak yerine import et.

---

## Yapılmaması Gerekenler

- `npm install` ile yeni paket ekleme — proje sıfır bağımlılık ile çalışır.
- React, Vue, Angular veya başka framework kullanma.
- API anahtarı veya token'ı kod içine (hardcode) yazma — tüm sırlar ortam değişkeni.
- Ana kullanıcı akış mantığını `index.html` dışına taşıma.
- Ayrı `.css` veya `.js` dosyası oluşturma (API handler'lar ve `lib/` hariç).
- Mevcut CSS değişkenlerini önemsizce değiştirme — renk sistemi tutarlı kalmalı.
- `api/` klasörüne HTML sayfaları koymak — `api/durum-sorgula.js` hatasını tekrarlama.
- Root-level `auth.js` / `db.js` gibi kullanılmayan dosyaları genişletme.

---

## Görev Teslim Formatı

Her görevde şu sıra izlenir:

1. **Önce oku** — değiştirilecek dosyayı tam olarak oku.
2. **Minimal değişiklik yap** — sadece istenen özelliği veya düzeltmeyi uygula, çevreleyen kodu yeniden yazma.
3. **Gereksiz yeniden yazımdan kaçın** — çalışan kod dokunulmadan bırakılır.
4. **Stil tutarlılığını koru** — ilgili sayfanın CSS değişkenlerini ve bileşen sınıflarını kullan.
5. **Commit ve push** — `claude/claude-md-docs-4xotQ` branch'ine.
