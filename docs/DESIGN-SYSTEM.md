# NEWSPENGUEN · Design System v2 (Premium Dark)

Kaynak kod: `app/app.css` (tokenlar `:root` içinde). Logo ve ikon dosyaları: `docs/brand/`.

## Marka

| Öğe | Dosya | Not |
|---|---|---|
| Sembol (penguen başı + kanat çizgisi) | `docs/brand/mark.svg`, `app/brand/mark.svg` | Mavi gövde gradyanı, beyaz yüz hilali, amber gaga, kanat "swoosh" çizgisi |
| Koyu zemin logo | `docs/brand/logo-dark.png` | Uygulama içi varsayılan |
| Açık zemin logo | `docs/brand/logo-light.png` | Sunum, doküman, e-posta |
| App ikonu (1024, alfasız) | `docs/brand/icon-1024.png` | iOS `AppIcon` setine kopyalandı |
| Açılış ekranı | `ios/App/App/Assets.xcassets/Splash.imageset/` | 2732×2732 |

Yazı: **NEWSPENGUEN®** (800 ağırlık, 2–3 pt harf aralığı) · alt satır *Industry & Project Insights*.
Koruma alanı: sembol yüksekliğinin %25'i. En küçük kullanım: 24 pt sembol.

## Renk

| Token | HEX | Kullanım |
|---|---|---|
| `--np-night-900` | `#050B1F` | Uygulama zemini |
| `--np-night-800` | `#081230` | İkincil zemin |
| `--np-night-700` | `#0C1A40` | Kart |
| `--np-night-600` | `#12234F` | Giriş alanı, vurgulu kart |
| `--np-night-500` | `#1A2E62` | Çizgi vurgusu |
| `--np-blue-500` | `#2F6BFF` | Birincil buton, seçili sekme |
| `--np-blue-400` | `#4C8DFF` | Odak halkası, bağlantı |
| `--np-blue-300` | `#8DB8FF` | İkincil vurgu metni |
| `--np-amber-400` | `#FFB547` | Fırsat puanı, "Bölgem", uyarı |
| `--np-green-400` | `#2BD48A` | Başarı, "Devam ediyor" |
| `--np-red-400` | `#FF5A5F` | Hata, çıkış |
| `--np-white` | `#F3F6FC` | Birincil metin |
| `--np-grey-300` | `#B4C1DC` | İkincil metin |
| `--np-grey-500` | `#7486AD` | Üçüncül metin, ikon |

Sektör renkleri: Endüstri `#4C8DFF` · Altyapı `#2BB7D4` · Enerji `#2BD48A` · Denizcilik `#5A7CFF` · Petrokimya `#FF8A4C` · Yapı `#B28DFF`.

## Tipografi

iOS sistem fontu (SF Pro). Ölçek (pt): Large title 32 · Title1 26 · Title2 21 · Title3 19 · Headline 17 · Body 16 · Callout 15 · Subhead 14 · Footnote 13 · Caption 12 · Caption2 11. Başlıklar 700–800, gövde 400–500, satır yüksekliği 1.45–1.6. Türkçe karakterler (ç ğ ı İ ö ş ü) tüm ağırlıklarda test edildi.

## Boşluk, köşe, gölge

- 4 pt ızgara: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Ekran kenar boşluğu 20 pt.
- Köşe yarıçapı: 8 (etiket) · 12 (giriş alanı) · 14 (buton, satır grubu) · 18 (kart) · 24 (büyük kart, harita) · tam (çip).
- Gölge: kart `0 10px 30px rgba(0,0,0,.35)`, birincil buton `0 10px 26px rgba(47,107,255,.38)`.
- Dokunma hedefi en az 44×44 pt. Güvenli alanlar `env(safe-area-inset-*)` ile.

## Bileşenler

| Bileşen | Sınıf | Not |
|---|---|---|
| Gezinme çubuğu | `.navbar`, `.navrow`, `.ltitle`, `.ntitle` | Yapışkan, bulanık arka plan; büyük başlık sekme ekranlarında |
| Alt sekme çubuğu | `.tabbar`, `.tab` | Ana Sayfa, Sektörler, Projeler, Hesapla, Kayıtlı |
| Butonlar | `.btn`, `.secondary`, `.ghost`, `.danger`, `.apple` | 52 pt yükseklik |
| Çip ve segment | `.chip`, `.seg` | Sayaçlı (`.n`) |
| Form | `.field`, `.input`, `.unit`, `.hint`, `.err`, `.check`, `.switch` | Birimli sayı alanları |
| Kartlar | `.ncard` (haber), `.pcard` (proje), `.card`, `.hero/.slide` | Konuya uygun vektör görsel (`scenes.js`) |
| Liste satırı | `.rows`, `.row`, `.ri`, `.rt`, `.cnt` | iOS gruplu liste |
| Detay | `.dhero`, `.dtitle`, `.facts`, `.why`, `.related` | |
| Harita | `.mapbox`, `.bub`, `.legend` | Türkiye / Marmara yakınlaştırma |
| Hesaplama | `.steps`, `.opt`, `.pills`, `.layer`, `.film`, `.result`, `.kpis`, `.lres` | |
| Alt sayfa ve bildirim | `.sheet`, `.toast` | |

## Görseller

Haber görselleri fotoğraf değil, konuya göre çizilmiş vektör sahnelerdir (`app/scenes.js`): demiryolu, havalimanı, offshore, rüzgar, güneş, rafineri, boru hattı, iletim hattı, santral, liman, gemi, köprü, tünel, su/arıtma, yol, bina, çelik yapı, fabrika, tank. Konu haber başlığı, şirket ve özetinden bulunur; böylece lisans sorunu olmaz ve görsel içerikle uyumlu kalır.
