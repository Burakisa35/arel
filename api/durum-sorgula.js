<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#050c1a">
  <meta name="format-detection" content="telephone=no">
  <title>Talep Durumu | TEHAŞ Teknik Hizmetler</title>
  <meta name="description" content="REF numarası veya telefon son 4 haneyle talep durumunuzu sorgulayın.">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&display=swap" rel="stylesheet">

  <style>
    /* ─── Tokens ─────────────────────────────────────────── */
    :root {
      --bg:        #050c1a;
      --bg-1:      #091422;
      --bg-2:      #0d1c30;
      --line:      #162336;
      --line-2:    #1e3050;
      --t-1:       #eaf0ff;
      --t-2:       #7c9cbf;
      --t-3:       #3f5a7a;
      --t-4:       #253548;

      --blue:      #3b82f6;
      --blue-dim:  rgba(59, 130, 246, .10);
      --blue-glow: rgba(59, 130, 246, .30);
      --green:     #34d399;
      --green-dim: rgba(52, 211, 153, .10);
      --red:       #f87171;

      --mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
      --head: 'Syne', system-ui, sans-serif;

      --safe-t: env(safe-area-inset-top, 0px);
      --safe-b: env(safe-area-inset-bottom, 0px);
      --ease:   cubic-bezier(.22, .8, .2, 1);
      --r:      14px;
    }

    /* ─── Reset ──────────────────────────────────────────── */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    html {
      background: var(--bg);
      -webkit-text-size-adjust: 100%;
    }

    /* ─── Body & Background ──────────────────────────────── */
    body {
      min-height: 100dvh;
      background:
        radial-gradient(ellipse 80% 40% at 50% -5%, rgba(59, 130, 246, .13), transparent 60%),
        radial-gradient(ellipse 40% 30% at 85% 80%, rgba(20, 60, 110, .15), transparent 50%),
        var(--bg);
      color: var(--t-1);
      font-family: var(--mono);
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* Subtle grid overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(59, 130, 246, .025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, .025) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
      z-index: 0;
    }

    button, input { font: inherit; color: inherit; }
    button { border: 0; background: none; cursor: pointer; }
    a { color: inherit; text-decoration: none; }

    /* ─── Layout ─────────────────────────────────────────── */
    .app {
      position: relative;
      z-index: 1;
      max-width: 460px;
      min-height: 100dvh;
      margin: 0 auto;
      padding:
        calc(var(--safe-t) + 20px)
        20px
        calc(var(--safe-b) + 36px);
    }

    /* ─── Header ─────────────────────────────────────────── */
    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 11px;
    }

    /* Logo mark: two concentric rings + dot */
    .logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(59, 130, 246, .35);
      background: rgba(59, 130, 246, .07);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }

    .logo::before {
      content: '';
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      border: 1.5px solid rgba(59, 130, 246, .55);
    }

    .logo::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--blue);
      box-shadow: 0 0 10px var(--blue), 0 0 20px var(--blue-glow);
    }

    .brand-name {
      font-family: var(--head);
      font-weight: 700;
      font-size: 14px;
      letter-spacing: .2em;
      color: var(--t-1);
    }

    .brand-sub {
      font-size: 9px;
      letter-spacing: .18em;
      color: var(--t-3);
      text-transform: uppercase;
      margin-top: 2px;
    }

    .nav-home {
      font-size: 10px;
      letter-spacing: .14em;
      color: var(--t-2);
      border: 1px solid var(--line);
      border-radius: 99px;
      padding: 7px 13px;
      background: rgba(9, 20, 34, .6);
      text-transform: uppercase;
      transition: border-color .2s, color .2s;
    }

    .nav-home:hover {
      border-color: var(--line-2);
      color: var(--t-1);
    }

    /* ─── Hero ───────────────────────────────────────────── */
    .hero {
      margin-bottom: 24px;
    }

    .eye {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 9px;
      letter-spacing: .22em;
      color: var(--blue);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .eye::before {
      content: '';
      width: 16px;
      height: 1px;
      background: var(--blue);
      opacity: .6;
    }

    h1 {
      font-family: var(--head);
      font-weight: 700;
      font-size: 28px;
      line-height: 1.2;
      color: var(--t-1);
      margin-bottom: 10px;
      letter-spacing: -.01em;
    }

    .lead {
      font-size: 12px;
      color: var(--t-2);
      line-height: 1.65;
      letter-spacing: .02em;
    }

    /* ─── Card ───────────────────────────────────────────── */
    .card {
      background: var(--bg-1);
      border: 1px solid var(--line);
      border-radius: var(--r);
      padding: 18px;
      margin-bottom: 14px;
    }

    /* ─── Tabs ───────────────────────────────────────────── */
    .tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 18px;
    }

    .tab {
      height: 38px;
      border-radius: 7px;
      font-size: 11px;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--t-3);
      transition: background .2s var(--ease), color .2s;
    }

    .tab.is-on {
      background: var(--bg-2);
      color: var(--t-1);
      border: 1px solid var(--line-2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, .3);
    }

    /* ─── Form Panels ────────────────────────────────────── */
    .panel { display: none; }
    .panel.is-on { display: block; }

    /* ─── Fields ─────────────────────────────────────────── */
    .field { margin-bottom: 13px; }

    .field label {
      display: block;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: .2em;
      color: var(--t-3);
      text-transform: uppercase;
      margin-bottom: 7px;
    }

    .field input {
      width: 100%;
      height: 50px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--bg);
      padding: 0 14px;
      outline: none;
      font-size: 14px;
      letter-spacing: .04em;
      color: var(--t-1);
      transition: border-color .18s, background .18s;
    }

    .field input::placeholder {
      color: var(--t-4);
    }

    .field input:focus {
      border-color: rgba(59, 130, 246, .5);
      background: var(--bg-2);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, .07);
    }

    .hint {
      font-size: 10px;
      color: var(--t-4);
      line-height: 1.55;
      margin-top: 6px;
      letter-spacing: .02em;
    }

    /* ─── Submit Button ──────────────────────────────────── */
    .submit {
      width: 100%;
      height: 52px;
      border-radius: 11px;
      background: var(--blue);
      color: #fff;
      font-family: var(--head);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: .1em;
      text-transform: uppercase;
      margin-top: 4px;
      box-shadow:
        0 8px 24px -8px rgba(59, 130, 246, .55),
        inset 0 1px rgba(255, 255, 255, .15);
      transition: transform .15s var(--ease), box-shadow .15s, opacity .15s;
    }

    .submit:active {
      transform: scale(.98);
      box-shadow: 0 4px 12px -4px rgba(59, 130, 246, .4);
    }

    .submit:disabled {
      opacity: .4;
      box-shadow: none;
      cursor: not-allowed;
    }

    /* ─── Error ──────────────────────────────────────────── */
    .err {
      display: none;
      background: rgba(248, 113, 113, .07);
      border: 1px solid rgba(248, 113, 113, .2);
      color: #fca5a5;
      border-radius: 10px;
      padding: 11px 13px;
      font-size: 12px;
      letter-spacing: .02em;
      margin-bottom: 14px;
      line-height: 1.5;
    }

    .err.is-on { display: block; }

    /* ─── Loading ────────────────────────────────────────── */
    .loading {
      display: none;
      align-items: center;
      gap: 10px;
      color: var(--t-2);
      font-size: 10px;
      letter-spacing: .16em;
      text-transform: uppercase;
      margin-top: 14px;
    }

    .loading.is-on { display: flex; }

    .spin {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid var(--line-2);
      border-top-color: var(--blue);
      animation: spin 1s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Result Section ─────────────────────────────────── */
    .result { display: none; }
    .result.is-on { display: block; }

    /* ─── Summary Table ──────────────────────────────────── */
    .summary-label {
      font-size: 9px;
      letter-spacing: .22em;
      color: var(--blue);
      text-transform: uppercase;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .summary-label::before {
      content: '';
      width: 16px;
      height: 1px;
      background: var(--blue);
      opacity: .6;
    }

    .summary {
      display: grid;
      gap: 1px;
      background: var(--line);
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .row {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 12px;
      padding: 12px 13px;
      background: var(--bg-1);
      align-items: baseline;
    }

    .k {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: .14em;
      color: var(--t-3);
      text-transform: uppercase;
      padding-top: 1px;
    }

    .v {
      font-size: 13px;
      font-weight: 500;
      color: var(--t-1);
      letter-spacing: .02em;
    }

    .ref-pill {
      color: var(--blue);
      letter-spacing: .12em;
    }

    /* ─── Timeline ───────────────────────────────────────── */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 14px;
    }

    .step {
      display: grid;
      grid-template-columns: 38px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 12px 13px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--bg-1);
      position: relative;
      transition: border-color .2s;
    }

    /* Connecting line between steps */
    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 31px;
      top: 100%;
      width: 1px;
      height: 6px;
      background: var(--line);
    }

    .ico {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1px solid var(--line-2);
      background: var(--bg-2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--t-4);
      flex-shrink: 0;
    }

    .ico svg {
      width: 18px;
      height: 18px;
    }

    .st-title {
      font-family: var(--head);
      font-weight: 600;
      font-size: 13px;
      color: var(--t-2);
      line-height: 1.3;
    }

    .st-sub {
      font-size: 10px;
      color: var(--t-4);
      letter-spacing: .03em;
      margin-top: 2px;
    }

    .mark {
      font-size: 11px;
      color: var(--t-4);
      letter-spacing: .04em;
    }

    /* Done state */
    .step.done {
      border-color: rgba(52, 211, 153, .2);
    }

    .step.done .ico {
      color: var(--green);
      border-color: rgba(52, 211, 153, .3);
      background: var(--green-dim);
    }

    .step.done .st-title { color: var(--t-2); }
    .step.done .mark { color: var(--green); }

    /* Active state */
    .step.active {
      border-color: rgba(59, 130, 246, .55);
      background: var(--blue-dim);
      box-shadow:
        inset 0 0 0 1px rgba(59, 130, 246, .06),
        0 0 28px -14px var(--blue);
    }

    .step.active .ico {
      color: var(--blue);
      border-color: rgba(59, 130, 246, .45);
      background: rgba(59, 130, 246, .1);
      box-shadow: 0 0 16px -6px var(--blue-glow);
    }

    .step.active .st-title { color: var(--t-1); }
    .step.active .mark { color: var(--blue); }

    /* ─── Actions ────────────────────────────────────────── */
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 14px;
    }

    .action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-height: 46px;
      border-radius: 10px;
      border: 1px solid var(--line-2);
      background: var(--bg-1);
      font-family: var(--head);
      font-weight: 600;
      font-size: 12px;
      letter-spacing: .06em;
      color: var(--t-1);
      text-transform: uppercase;
      transition: border-color .18s, background .18s;
      cursor: pointer;
    }

    .action:hover {
      border-color: var(--line-2);
      background: var(--bg-2);
    }

    .action.primary {
      background: var(--blue);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 6px 18px -6px rgba(59, 130, 246, .5);
    }

    .action.primary:hover {
      background: #4f93f7;
    }

    /* ─── Footer ─────────────────────────────────────────── */
    .foot {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
      font-size: 10px;
      color: var(--t-4);
      line-height: 1.7;
      letter-spacing: .03em;
      text-align: center;
    }

    /* ─── Responsive ─────────────────────────────────────── */
    @media (max-width: 360px) {
      h1 { font-size: 24px; }
      .row { grid-template-columns: 78px 1fr; }
      .actions { grid-template-columns: 1fr; }
      .app { padding-left: 16px; padding-right: 16px; }
    }
  </style>
</head>
<body>
<main class="app">

  <!-- Header -->
  <header class="hdr">
    <a class="brand" href="/" aria-label="TEHAŞ ana sayfa">
      <span class="logo"></span>
      <span>
        <span class="brand-name">TEHAŞ</span><br>
        <span class="brand-sub">Teknik Hizmetler</span>
      </span>
    </a>
    <a class="nav-home" href="/">Ana sayfa</a>
  </header>

  <!-- Hero -->
  <section class="hero">
    <div class="eye">Durum takip</div>
    <h1>Talebinizin durumunu sorgulayın.</h1>
    <p class="lead">REF numaranızla veya ad&nbsp;+ telefon son 4 haneyle kayıt durumunuzu kontrol edin.</p>
  </section>

  <!-- Query Card -->
  <section class="card" aria-label="Durum sorgulama formu">

    <!-- Tabs -->
    <div class="tabs" role="tablist">
      <button class="tab is-on" type="button" data-tab="ref">REF ile</button>
      <button class="tab"       type="button" data-tab="identity">Bilgilerle</button>
    </div>

    <!-- Error -->
    <div id="errorBox" class="err" role="alert"></div>

    <!-- Panel: REF -->
    <form id="refPanel" class="panel is-on" data-panel="ref">
      <div class="field">
        <label for="refInput">REF Numarası</label>
        <input id="refInput"
               type="text"
               autocomplete="off"
               autocapitalize="characters"
               placeholder="TH-XXXXXX veya AB-XXXXXX">
        <div class="hint">Done ekranında gösterilen referans kodunu girin.</div>
      </div>
      <button class="submit" type="submit">Sorgula</button>
    </form>

    <!-- Panel: Kimlik -->
    <form id="identityPanel" class="panel" data-panel="identity">
      <div class="field">
        <label for="nameInput">Ad Soyad</label>
        <input id="nameInput"
               type="text"
               autocomplete="name"
               placeholder="Adınız veya soyadınız">
      </div>
      <div class="field">
        <label for="phoneLast4Input">Telefon Son 4 Hane</label>
        <input id="phoneLast4Input"
               type="tel"
               inputmode="numeric"
               autocomplete="off"
               maxlength="4"
               placeholder="7805">
        <div class="hint">REF unutulduysa yalnızca son 4 hane ile sınırlı sorgu yapılır.</div>
      </div>
      <button class="submit" type="submit">Bilgilerle Sorgula</button>
    </form>

    <!-- Loading -->
    <div id="loading" class="loading">
      <span class="spin"></span> Sorgulanıyor
    </div>

  </section>

  <!-- Result -->
  <section id="result" class="result" aria-live="polite">
    <div class="card">
      <div class="summary-label">Talep özeti</div>

      <div class="summary">
        <div class="row"><div class="k">REF</div>      <div class="v ref-pill" id="rRef">—</div></div>
        <div class="row"><div class="k">Problem</div>  <div class="v" id="rProblem">—</div></div>
        <div class="row"><div class="k">Bölge</div>    <div class="v" id="rRegion">—</div></div>
        <div class="row"><div class="k">Durum</div>    <div class="v" id="rStatus">—</div></div>
        <div class="row"><div class="k">Güncelleme</div><div class="v" id="rUpdated">—</div></div>
      </div>

      <div class="timeline" id="timeline"></div>

      <div class="actions">
        <a id="waLink" class="action primary" href="#" target="_blank" rel="noopener">
          WhatsApp'tan Yaz
        </a>
        <button id="copyRef" class="action" type="button">
          REF Kopyala
        </button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="foot">
    Bu ekran yalnızca talep durumunuzu göstermek için kullanılır.<br>
    Kayıt bulunamazsa REF numarasını kontrol edin veya WhatsApp üzerinden yazın.
  </footer>

</main>

<script>
(() => {
  'use strict';

  /* ─── Config ─────────────────────────────────────────── */
  const ADMIN_PHONE = '905367807059';

  const STATUS_STEPS = [
    { key: 'pending',           label: 'Talep Alındı',      sub: 'Kayıt sisteme ulaştı',                        icon: 'mail'   },
    { key: 'inceleniyor',       label: 'İnceleniyor',       sub: 'Talep teknik olarak değerlendiriliyor',        icon: 'search' },
    { key: 'teknisyen_atandi',  label: 'Teknisyen Atandı',  sub: 'Uygun teknik kişi belirlendi',                 icon: 'user'   },
    { key: 'yolda',             label: 'Teknisyen Yolda',   sub: 'Saha yönlendirmesi başladı',                   icon: 'truck'  },
    { key: 'tamamlandi',        label: 'Tamamlandı',        sub: 'Talep kapatıldı',                              icon: 'check'  },
  ];

  const ALIASES = {
    talep_alindi:     'pending',
    alindi:           'pending',
    new:              'pending',
    review:           'inceleniyor',
    assigned:         'teknisyen_atandi',
    atandi:           'teknisyen_atandi',
    teknisyen_yolda:  'yolda',
    onway:            'yolda',
    done:             'tamamlandi',
    closed:           'tamamlandi',
  };

  /* ─── DOM refs ───────────────────────────────────────── */
  const $ = s => document.querySelector(s);

  const el = {
    err:      $('#errorBox'),
    loading:  $('#loading'),
    result:   $('#result'),
    ref:      $('#refInput'),
    name:     $('#nameInput'),
    last4:    $('#phoneLast4Input'),
    timeline: $('#timeline'),
  };

  /* ─── Icon SVGs ──────────────────────────────────────── */
  function icon(name) {
    const base = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

    const map = {
      mail:   `<svg ${base}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/><path d="m15 16 2 2 4-4"/></svg>`,
      search: `<svg ${base}><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/><path d="M8 10.5h5M10.5 8v5"/></svg>`,
      user:   `<svg ${base}><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M17 4l3 1.5v4c0 2-1.2 3.5-3 4.5-1.8-1-3-2.5-3-4.5v-4L17 4z"/></svg>`,
      truck:  `<svg ${base}><path d="M3 7h11v9H3z"/><path d="M14 10h3l4 4v2h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
      check:  `<svg ${base}><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.6 2.6L16.5 9"/></svg>`,
    };

    return map[name] ?? map.check;
  }

  /* ─── Helpers ────────────────────────────────────────── */
  function cleanRef(v) {
    return String(v || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
  }

  function cleanName(v) {
    return String(v || '').trim().replace(/[<>]/g, '').slice(0, 80);
  }

  function normalizedStatus(v) {
    return ALIASES[v] || v || 'pending';
  }

  function statusLabel(key) {
    const s = STATUS_STEPS.find(x => x.key === normalizedStatus(key));
    return s ? s.label : 'Talep Alındı';
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
  }

  /* ─── UI helpers ─────────────────────────────────────── */
  function setErr(msg) {
    el.err.textContent = msg;
    el.err.classList.toggle('is-on', !!msg);
  }

  function setLoading(on) {
    el.loading.classList.toggle('is-on', on);
    document.querySelectorAll('.submit').forEach(b => b.disabled = on);
  }

  /* ─── Timeline Renderer ──────────────────────────────── */
  function renderTimeline(status) {
    const activeKey = normalizedStatus(status);
    let activeIndex = STATUS_STEPS.findIndex(s => s.key === activeKey);
    if (activeIndex < 0) activeIndex = 0;

    el.timeline.innerHTML = STATUS_STEPS.map((s, i) => {
      const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : '';
      const mark  = i < activeIndex ? '✓' : i === activeIndex ? '●' : '○';

      return `
        <div class="step ${state}">
          <div class="ico">${icon(s.icon)}</div>
          <div>
            <div class="st-title">${s.label}</div>
            <div class="st-sub">${s.sub}</div>
          </div>
          <div class="mark">${mark}</div>
        </div>`;
    }).join('');
  }

  /* ─── Result Renderer ────────────────────────────────── */
  function render(data) {
    const ref = data.ref || data.ref_code || '—';

    $('#rRef').textContent      = ref;
    $('#rProblem').textContent  = data.problem || data.problem_type || data.aciklama || 'Belirtilmedi';
    $('#rRegion').textContent   = data.bolge   || data.region       || data.adres    || 'Belirtilmedi';
    $('#rStatus').textContent   = statusLabel(data.durum || data.status);
    $('#rUpdated').textContent  = formatDate(data.guncelleme || data.updated_at || data.created_at);

    renderTimeline(data.durum || data.status);

    const msg = encodeURIComponent(`Merhaba, ${ref} referans numaralı talebim hakkında bilgi almak istiyorum.`);
    $('#waLink').href = `https://wa.me/${ADMIN_PHONE}?text=${msg}`;

    $('#copyRef').onclick = async () => {
      try {
        await navigator.clipboard.writeText(ref);
        $('#copyRef').textContent = 'Kopyalandı';
        setTimeout(() => $('#copyRef').textContent = 'REF Kopyala', 1400);
      } catch (_) {}
    };

    el.result.classList.add('is-on');
    el.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ─── API Call ───────────────────────────────────────── */
  async function query(params) {
    setErr('');
    setLoading(true);

    try {
      const url = '/api/durum-sorgula?' + new URLSearchParams(params).toString();
      const res  = await fetch(url, { headers: { Accept: 'application/json' } });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) throw new Error(json.error || 'Talep bulunamadı.');

      render(json.data || json);

    } catch (err) {
      el.result.classList.remove('is-on');
      setErr(err.message || 'Sorgulama sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  /* ─── Event Listeners ────────────────────────────────── */

  // Tab switching
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      document.querySelectorAll('.panel').forEach(p => {
        p.classList.toggle('is-on', p.dataset.panel === btn.dataset.tab);
      });
      setErr('');
    });
  });

  // REF input: auto-uppercase & sanitize
  el.ref.addEventListener('input', () => {
    el.ref.value = cleanRef(el.ref.value);
  });

  // Phone input: digits only
  el.last4.addEventListener('input', () => {
    el.last4.value = el.last4.value.replace(/\D/g, '').slice(0, 4);
  });

  // REF form submit
  $('#refPanel').addEventListener('submit', e => {
    e.preventDefault();
    const ref = cleanRef(el.ref.value);
    if (ref.length < 5) return setErr('Geçerli bir REF numarası girin.');
    query({ ref });
  });

  // Identity form submit
  $('#identityPanel').addEventListener('submit', e => {
    e.preventDefault();
    const name       = cleanName(el.name.value);
    const phoneLast4 = el.last4.value.replace(/\D/g, '');
    if (name.length < 2 || phoneLast4.length !== 4) {
      return setErr('Ad ve telefonun son 4 hanesini girin.');
    }
    query({ name, phoneLast4 });
  });

  // Auto-query if ?ref= param in URL
  const initialRef = new URLSearchParams(location.search).get('ref');
  if (initialRef) {
    el.ref.value = cleanRef(initialRef);
    query({ ref: el.ref.value });
  }

})();
</script>
</body>
</html>
