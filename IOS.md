# NEWSPENGUEN iOS uygulaması (TestFlight)

Uygulama, kökteki `index.html`'i Capacitor ile saran bir iOS uygulamasıdır. Zamanlanmış görev `index.html`'i güncellemeye devam eder; her yeni TestFlight derlemesi o anki haberleri içine alır ve açılışta Supabase'den güncel haberleri çeker.

Uygulamaya özel eklemeler (`app/` klasöründe; web sitesini etkilemez):
- **Protective Hesap** sekmesi (`app/app.js`): yalnızca protective boyalar için. Alan, elle girilen fire (%), para birimi (₺/€/$); her kat için DFT, hacimce katı madde, kat sayısı, kit hacmi, birim fiyat. Sonuç: kat bazında teorik/pratik yayılma, yaş film, litre, kit; toplam DFT, L/m², m² maliyeti. Alan yardımcısı: çelik tonaj × m²/ton, boru (π·D·L), tank (gövde + çatı/taban). Hazır sistemler: ISO 12944 C3, C4, C5, CX ve pasif yangın (intümesan).
- **Konum filtresi**: Ana Sayfa, Sektörler ve Projeler'de bölge (Marmara, Ege…) veya il bazında seçim; ilçe ve kurum adlarından (Çorlu, Gebze, İBB…) ile eşleştirme, "Bölgem" ve "Yurt dışı" kısayolları.
- Arayüz (`app/app.css`): ana sayfada Boya Hesapla kısayolu, çentik/Dynamic Island boşluğu, yeni alt menü (Ana Sayfa, Sektörler, Projeler, Hesapla, Kayıtlı; Profil sağ üstte), işlevsiz zil ve ayar satırları kaldırıldı.
- Haberler uygulama içi Safari görünümünde açılır, "linki kopyala" yerine iOS paylaş menüsü çıkar; açılış ekranı ve simge.

## Senin yapman gerekenler (bir kerelik)

1. **Apple Developer Program**'a katıl (yıllık 99 USD): https://developer.apple.com/programs/enroll/
2. **Team ID**'yi not et: https://developer.apple.com/account → Membership details → Team ID (10 karakter).
3. **Uygulama kaydı** aç: https://appstoreconnect.apple.com → Apps → "+" → New App
   - Platform: iOS, Ad: NEWSPENGUEN, Dil: Türkçe
   - Bundle ID: `io.github.kurnazrecep16.newspenguen` (listede yoksa önce https://developer.apple.com/account/resources/identifiers/list adresinden "App IDs" olarak ekle)
   - SKU: `newspenguen`
4. **API anahtarı** oluştur: App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → "+"
   - Erişim: **Admin** (bulut imzalama sertifikası için gerekli)
   - `.p8` dosyasını indir (yalnızca bir kez indirilebilir), **Key ID** ve sayfanın üstündeki **Issuer ID**'yi not et.
5. **GitHub Secrets** ekle: https://github.com/kurnazrecep16-web/newspenguen/settings/secrets/actions → New repository secret
   - `APPLE_TEAM_ID` → Team ID
   - `ASC_KEY_ID` → Key ID
   - `ASC_ISSUER_ID` → Issuer ID
   - `ASC_KEY_P8` → `.p8` dosyasının tüm metni (BEGIN/END satırları dahil)

## Derleme

- Bu daldaki uygulama dosyaları değişince akış otomatik çalışır. Anahtarlar yoksa sadece imzasız bir deneme derlemesi yapar.
- Anahtarlar eklendikten sonra Actions → **iOS TestFlight** → "Re-run all jobs" ile yeniden çalıştır. 15 ile 25 dakika içinde derleme TestFlight'a düşer.
- "Run workflow" düğmesi, akış dosyası `main`'e alındıktan sonra görünür.

## Test kullanıcıları

App Store Connect → uygulama → TestFlight:
- **İç test** (100 kişiye kadar, inceleme yok): kişiyi önce Users and Access'e ekle, sonra Internal Testing grubuna.
- **Dış test** (10.000 kişiye kadar): External Testing grubu oluştur, ilk derleme için kısa bir beta incelemesi istenir; sonra herkese açık bir davet linki üretilebilir.
- Testçiler iPhone'a **TestFlight** uygulamasını kurar. Her derleme 90 gün geçerlidir.

## Yerelde (Mac'te) açmak

```
npm ci
npm run sync
open ios/App/App.xcodeproj
```
