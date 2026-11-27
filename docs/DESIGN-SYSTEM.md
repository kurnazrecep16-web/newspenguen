# COATNEWS · Design System v3

Kaynak: COATNEWS Brand Guideline & UI Concept v1.2. Kod: `app/app.css` (tokenlar `:root` içinde). Logo ve ikon dosyaları: `docs/brand/`.

## Marka

Ad **COATNEWS** · tanım *Global Coatings Media* · slogan *The Global Voice of the Coatings Industry.*

| Öğe | Dosya | Not |
|---|---|---|
| Sembol (üç akışkan bantlı katmanlı küre) | `docs/brand/mark.svg`, `app/brand/mark.svg` | Sky Blue, Coat Blue ve lacivert bantlar |
| Tek renk sembol | `docs/brand/mark-mono.svg`, `symbol-mono.png` | Tek renk baskı |
| Sembol (şeffaf) | `docs/brand/symbol.png` | |
| Yatay logo, açık / koyu | `docs/brand/logo-light.png`, `logo-dark.png` | "NEWS" News Orange |
| Dikey logo, açık / koyu | `docs/brand/logo-stacked-light.png`, `logo-stacked-dark.png` | |
| App ikonu (1024, alfasız) | `docs/brand/icon-1024.png` | iOS `AppIcon` setine kopyalandı |
| Açılış ekranı | `ios/App/App/Assets.xcassets/Splash.imageset/` | 2732×2732 |

## Renk

| Ad | HEX | Token |
|---|---|---|
| Deep Navy | `#0B1F3B` | `--np-night-800` (zemin) |
| Coat Blue | `#0066FF` | `--np-blue-500` (birincil) |
| Sky Blue | `#4DB8FF` | `--np-blue-400` |
| News Orange | `#FF7A00` | `--np-amber-400` (vurgu, fırsat puanı) |
| Violet | `#7B61FF` | segment |
| Teal | `#00A58C` | segment |
| Slate | `#E2E8F0` | çizgi, açık zemin |
| Cloud | `#F5F7FA` | `--np-white` (birincil metin) |

Segmentler (bu sırayla): Marine Coatings `#4DB8FF` · Protective Coatings `#14B89C` · Powder Coatings `#9784FF` · Decorative Coatings `#FFB547` · Energy `#7BD36A`. Industrial yok (Protective içinde), Automotive yok.

## Tipografi

Montserrat (başlık, menü, buton) · Inter (arayüz, gövde) · Source Serif 4 (editoryal haber başlığı). Fontlar `app/fonts/` içinde gömülü (çevrimdışı çalışır). Ölçek (pt): Large title 32 · Title1 26 · Title2 21 · Headline 17 · Body 16 · Subhead 14 · Caption 12.

## Menü

Ana Sayfa · Haberler (segmentler) · Projeler · Hesapla · Daha Fazla (Kayıtlılar, harita, ayarlar, dil, yardım, hakkında). Arama Ana Sayfa üst çubuğunda. Misafir okuma açık; TR/EN tercih saklanır.

## Boşluk, köşe, gölge

- 4 pt ızgara: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Ekran kenar boşluğu 20 pt.
- Köşe yarıçapı: 8 (etiket) · 12 (giriş alanı) · 14 (buton, satır grubu) · 18 (kart) · 24 (büyük kart, harita) · tam (çip).
- Gölge: kart `0 10px 30px rgba(0,0,0,.35)`, birincil buton `0 10px 26px rgba(47,107,255,.38)`.
- Dokunma hedefi en az 44×44 pt. Güvenli alanlar `env(safe-area-inset-*)` ile.

## Bileşenler

| Bileşen | Sınıf | Not |
|---|---|---|
| Gezinme çubuğu | `.navbar`, `.navrow`, `.ltitle`, `.ntitle` | Yapışkan, bulanık arka plan; büyük başlık sekme ekranlarında |
| Alt sekme çubuğu | `.tabbar`, `.tab` | Ana Sayfa, Haberler, Projeler, Hesapla, Daha Fazla |
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
