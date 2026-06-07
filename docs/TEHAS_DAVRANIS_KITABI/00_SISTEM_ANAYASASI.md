# TEHAS Davranis Kitabi

## Amac

Bu klasor, TEHAS web sisteminde hangi ekranda ne gorunecegini, ne gorunmeyecegini ve hangi islemlerin bloklanacagini tanimlar.

Bu yapi gercek koddan once gelir. Kod yazilirken, ekran tasarlanirken, yeni ozellik eklenirken veya hata ayiklanirken ana kontrol kaynagi burasidir.

Bir ekran bozulursa, karisirsa veya yanlis ozellik eklenirse kontrol edilecek ana kaynak bu davranis kitabidir.

## Ana Mantik

Her kullanici kendi yoluna girer.

- Mevcut musteri, mevcut kayit ekranina gider.
- Yeni musteri, talep olusturma ekranina gider.
- Teknisyen adayi, basvuru ekranina gider.
- Bilgi almak isteyen ziyaretci, tanitim ve bilgi ekranina gider.

Her panel kendi amacinda kalir. Bir panel, baska panelin gorevini ustlenmez.

## Sistem Kurali

```js
const SYSTEM_RULE = {
  noMaybeLanguage: true,
  noWhatsapp: true,
  noMixedPanels: true,
  noUserDataWithoutVerification: true,
  noAdminLeak: true,
  everyPanelHasOwnPurpose: true,
  everyPanelHasShowHideBlockRules: true
};
```

## Yasak Dil

TEHAS sistem dilinde belirsiz ve gevsek yonlendirme kullanilmaz.

```txt
varsa
olabilir
belki
isterseniz
WhatsApp'tan yazin
suradan da gecebilirsiniz
```

## Ana Panel Kodlari

```txt
TH-M01 = Mevcut Musteri
TH-N02 = Yeni Talep
TH-T03 = Teknisyen Basvurusu
TH-B04 = Bilgi Merkezi
```

## Davranis Kural Tipleri

```js
showOnly = Bu panelde gorunmesi gerekenler.
hideAlways = Bu panelde kesinlikle gorunmemesi gerekenler.
blockIfUserTries = Kullanici denese bile izin verilmeyecek islemler.
```

## Kirmizi Cizgi

Musteri verisi, referans sorgulama, teknisyen basvurusu, servis talebi ve admin bilgisi ayni panelde karistirilmaz.

Her panelin siniri kayitlidir. Bu sinirlar kod yazilirken korunur.
