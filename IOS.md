# NEWSPENGUEN iOS uygulaması (TestFlight)

Uygulama `app/` klasöründeki ayrı bir iOS arayüzüdür (Design System v2, `docs/DESIGN-SYSTEM.md`). Haber verisi kökteki `index.html`'den alınır: `scripts/build-www.mjs`, zamanlanmış görevin güncellediği `/*DATA_START*/…/*DATA_END*/` bloğunu `www/data.js`'e çıkarır; `index.html` ve web sitesi değişmez. Uygulama açılışta Supabase'den son 30 günün haberlerini de çeker.

Ekranlar (`app/app.js`): açılış, onboarding, giriş, kayıt (Supabase e-posta hesabı, misafir modu), ana sayfa, güncel fırsatlar, sektörler, projeler, proje detayı, haber detayı, konum seçimi (bölge/il/Global), proje haritası (Türkiye/Marmara), Protective hesaplama (başlangıç, yüzey bilgisi, sistem, sonuç), kayıtlılar (fırsat, proje, hesap), profil ve ayarlar, arama.

- **Hesaplama**: çelik tonajı × m²/ton veya doğrudan m²; elle fire (%); katlar: hacimce katı madde, kat sayısı, kuru film ⇄ yaş film, isteğe bağlı $/L. Formüller: teorik yayılma = KM × 10 ÷ DFT, pratik = teorik × (1 − fire), WFT = DFT × 100 ÷ KM.
- **Görseller**: haber konusuna göre çizilmiş vektör sahneler (`app/scenes.js`).
- **Marka**: `app/brand/mark.svg`, `docs/brand/` (ikon, açık/koyu logo).
- Haberler uygulama içi Safari görünümünde açılır, paylaşım iOS menüsüyle yapılır (`app/native-bridge.js`).

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
