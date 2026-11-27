# COATNEWS — Global Brand Intelligence (GBI)

Bu klasör, Global Brand Intelligence özelliğinin mimarisini, mevcut sistem denetimini, kurulumunu ve işletimini anlatır.
Durum (27.11.2026): **Aşama 1–5 kodu ve testleri hazır; canlı Supabase'e henüz hiçbir şey uygulanmadı veya yayımlanmadı.**

## 1. Mevcut sistem denetimi (Faz 1)

| Katman | Bulgu |
|---|---|
| Site | `index.html` (main, GitHub Pages). Uygulama kabuğu `app/` (app.js, app.css, i18n.js TR/EN, scenes.js). Haber verisi `index.html` içinde `/*DATA_START*/…/*DATA_END*/` bloğunda ve Supabase `news_items` tablosundan canlı okunur. |
| iOS | Capacitor 8, `ios/`, `scripts/build-www.mjs`, `.github/workflows/ios-testflight.yml`. |
| Kimlik | Supabase Auth REST (e-posta + şifre), misafir modu. Uygulamada rol/yetki kavramı yok. |
| Haber toplama 1 | `pg_cron` işi (her saat :07) → `collect-news` edge function. Bing News RSS sorguları (marka adları dahil), 12 sektör RSS beslemesi, TED (AB ihaleleri) API. Regex filtre, başlık yakın-tekrar kontrolü, `news_items`'a yazar; 90 günden eski kayıtları siler. |
| Haber toplama 2 | 6 saatte bir Claude zamanlanmış görevi: web araması, puanlama (`score`, `why`, `company`), `news_items` gizleme ve `index.html` DATA bloğu. |
| Veritabanı | `news_items` (842 satır, RLS açık, herkese açık okuma) ve `feed_runs` (RLS açık). Ayrıca public şemada **53 boş tablo RLS kapalı** (users, companies, news_articles, investments …). Bunlar migration geçmişinde yok ve uygulama tarafından kullanılmıyor. |
| Eklentiler | pg_cron, pg_net, pg_trgm, pgcrypto, vault kurulu. |

### Denetimde bulunan riskler

1. **RLS kapalı 53 tablo.** Supabase'de public şemadaki RLS'siz tablolar, uygulamada gömülü publishable (anon) anahtarla PostgREST üzerinden okunup yazılabilir. Tablolar boş olsa da `users.password_hash`, `mfa_secret` gibi sütunlar var. Öneri: kullanılmıyorlarsa silmek, kullanılacaksa RLS açmak. Recep'in onayı olmadan dokunulmadı.
2. **Bing News RSS** (`bing.com/news/search?format=rss`) resmi, belgelenmiş bir API değil (Bing News Search API 2025'te kapatıldı). Her an çalışmayı bırakabilir ve kullanım koşulları belirsiz. GBI bu kaynağa dayanmaz.
3. `news_items` 90 günde silinir; marka zaman çizelgesi ve Share of Voice için GBI kendi tablolarını (`bi_`) kullanır ve silmez.

GBI mevcut akışa dokunmaz: `news_items`, `feed_runs`, `collect-news`, cron işi ve `index.html` DATA bloğu aynen kalır.

## 2. Mimari

```
pg_cron (saatlik) ──► brand-scan edge function
                        │ 1 markalar + alias'lar (bi_entities, bi_entity_aliases)
                        │ 2 çok dilli sorgular (bi_query_terms × bi_languages), rotasyonlu dilim
                        │ 3 sağlayıcılar: GDELT · TheNewsAPI · NewsAPI · RSS/resmi haber odaları (bi_feeds)
                        │ 4 normalize → kanonik URL → zaten kayıtlıysa atla (idempotent)
                        │ 5 alias çözümleme (en uzun eşleşme, belirsiz adlar, dışlama kelimeleri, ortak alias)
                        │ 6 kaplama bağlamı → 5 segment → konu (A–O) → ülke/bölge → içerik türü
                        │ 7 puan (marka / segment / kaynak / tazelik) → editoryal karar
                        │ 8 tekrar: aynı URL · benzer başlık · aynı basın bülteni (simhash) → tek "story"
                        ▼
  bi_stories ◄── bi_articles (kaynak başına bir satır, atıf + bağlantı)
      ├── bi_story_entities (main / mentioned / parent + kanıt alıntıları)
      └── bi_story_segments (puan + kanıt)
  editör: discovered / under_review → approved → published  ──► bi_notifications kuyruğu (trigger)
```

Kod:

| Dosya | Görev |
|---|---|
| `supabase/migrations/20261127190000_brand_intelligence.sql` | Tüm tablolar, indeksler, RLS, `bi_share_of_voice()`, `bi_overview()`, bildirim trigger'ı |
| `supabase/rollback/…down.sql` | Geri alma (yalnızca `bi_` nesneleri) |
| `supabase/seed/brands.json` → `brands.sql` | 39 varlık, 116 alias, 10 dilde 75 arama terimi |
| `supabase/functions/_shared/bi/` | Motor: `resolve`, `classify`, `score`, `dedup`, `queries`, `providers`, `pipeline` |
| `supabase/functions/brand-scan/index.ts` | Tarama işçisi |
| `tests/bi/*.test.ts`, `supabase/tests/bi_db.test.sql` | 48 motor testi + veritabanı testleri (RLS, bildirim, SoV, geri alma) |

### Taksonomi

Yalnızca beş ana segment: `marine`, `protective`, `powder`, `decorative`, `energy` (veritabanında CHECK kısıtı).
Endüstriyel kaplama → Protective; mimari boya → Decorative; Otomotiv ve Endüstriyel ayrı segment değildir.
Sürdürülebilirlik, teknoloji, finans vb. `topics` (A–O) ve `tags` olarak tutulur.

### Puanlama (şeffaf, ayarlanabilir)

- **Marka puanı**: başlıkta +40, girişte +15, tekrar +5/geçiş (en çok 15), ana konu +25, yalnızca gövdede +10, yalnızca belirsiz adla −20, ortak alias −25.
- **Segment puanı**: kural eşleşmesi başına; metinde segment işareti yoksa ve marka tek segmentliyse 35 (editör onayı gerekir).
- **Kaynak güveni**: high 90, medium 70, low 40, unreliable 10, bilinmiyor 55, resmi kaynak 90 (tanıtım olarak işaretlenir).
- **Genel**: ağırlıklar `bi_settings.weights` (varsayılan 0,40 / 0,25 / 0,20 / 0,15). Kaplama bağlamı yoksa en çok 49, ana konu marka yoksa en çok 74.
- Bantlar `bi_settings.thresholds` (90 / 75 / 50). Her haberin `score_breakdown` alanında hangi faktörün ne kattığı ve kanıt alıntıları saklanır.

### Editoryal politika

- `publishing.auto_publish` **varsayılan kapalı**. Açılsa bile işçi en fazla `approved` (yayın kuyruğu) verir, asla doğrudan `published` vermez; tanıtım amaçlı (basın bülteni, sponsorlu) içerik otomatik onaylanmaz.
- Belirsiz marka eşleşmesi veya `review_below` (75) altı → `under_review`. `reject_below` (25) altı → `rejected`.

### Telif ve kaynak bütünlüğü

- Tam makale metni hiçbir sağlayıcıdan alınmaz veya saklanmaz. GDELT için yalnızca başlık + bağlantı + meta (`storage_right = link_only`); TheNewsAPI / NewsAPI / RSS için yalnızca sağlayıcının verdiği kısa açıklama (`snippet`). NewsAPI'nin kesik `content` alanı atılır.
- Her haber `bi_articles` üzerinden orijinal yayıncı ve bağlantıyı korur; birleştirilen kopyalar ek kaynak olarak listelenir.
- `bi_stories.summary` COATNEWS'in kendi özetidir; `summary_is_ai` ile işaretlenir ve yayıncının metni gibi gösterilmez.
- Logo yalnızca `logo_authorized = true` ise gösterilmelidir.

## 3. Sağlayıcılar (27.11.2026'da belgelerden doğrulandı)

| Sağlayıcı | Durum | Erişim | Notlar |
|---|---|---|---|
| GDELT DOC 2.0 | Hazır, anahtarsız, varsayılan açık | `https://api.gdeltproject.org/api/v2/doc/doc?mode=ArtList&format=json` | Son 3 ay, en çok 250 kayıt/istek, `sourcelang:` filtresi, OR blokları iç içe olamaz. Sadece başlık/bağlantı/meta. İsteğe en az 5 sn ara bırakılır (GDELT "one every 5 seconds" uyarısı). Bu geliştirme ortamından GDELT'e ağ erişimi yoktu; ilk canlı çalıştırmada doğrulanmalı. |
| TheNewsAPI | Kod hazır, **kapalı**, anahtar gerekir | `GET https://api.thenewsapi.com/v1/news/all` (`api_token`, `search`, `language`, `published_after`) | Ücretsiz: günde 100 istek ama istek başına **3 makale** (pratikte yetersiz). Basic $19/ay: 2.500 istek, 25 makale. Ticari kullanım koşulları (`/tos`) okunup onaylanmalı. |
| NewsAPI.org | Kod hazır, **kapalı**, anahtar gerekir | `GET https://newsapi.org/v2/everything` (`X-Api-Key`) | Ücretsiz Developer planı **canlı/üretim ortamında yasak** (dahili kullanım dahil). Üretim için Business **$449/ay**. Türkçe ve Lehçe desteklenmez. Yeniden yayın ve "rakip haber veritabanı kurma" koşullarda yasak; COATNEWS için hukuki uygunluk ayrıca değerlendirilmeli. |
| RSS / resmi haber odaları | Hazır | `bi_feeds` | Besleme adresleri uydurulmaz: yönetici paneli resmi sitenin `<link rel="alternate">` etiketinden keşfeder (`discoverFeeds`). ETag / If-Modified-Since destekli. |

## 4. Kurulum (Recep'in onayıyla yapılacak)

1. **Migration** (canlı veritabanına): `supabase/migrations/20261127190000_brand_intelligence.sql`, sonra `supabase/seed/brands.sql`. Mevcut 7 migration repoda olmadığından `supabase db push` yerine Supabase MCP `apply_migration` veya SQL editörü kullanılmalı.
2. **Yönetici**: `insert into bi_staff (user_id, role) values ('<auth.users id>', 'admin');`
3. **Edge function**: `brand-scan` ve `bi-admin` (klasör `_shared/bi` ile birlikte) yayımlanır.
4. **Gizli anahtarlar** (Supabase → Edge Functions → Secrets): `BI_CRON_SECRET` (rastgele uzun dize, zorunlu). İsteğe bağlı: `THENEWSAPI_TOKEN`, `NEWSAPI_KEY`. Anahtarlar istemciye, repoya veya veritabanına yazılmaz; `bi_providers.key_env` yalnızca değişken adını tutar.
5. **Zamanlama** (saatlik, mevcut `collect-news` işinden farklı dakikada):
   ```sql
   select cron.schedule('bi-brand-scan', '37 * * * *', $$
     select net.http_post(
       url := 'https://<proje>.supabase.co/functions/v1/brand-scan',
       headers := jsonb_build_object('Content-Type', 'application/json',
                  'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
                  'x-bi-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bi_cron_secret')),
       timeout_milliseconds := 150000);
   $$);
   ```
   Tarama aralığı `bi_settings.scan.interval_minutes` ile belgelenir; cron ifadesi de buna göre değiştirilir.

## 5. İşletim

- Her tur: `bi_scan_runs` (durum, pencere, istatistik) ve `bi_scan_logs` (sağlayıcı bazında uyarı/hata).
- Sağlayıcı durumu: `bi_providers` (son başarı, son hata, art arda hata, günlük kullanım, hız sınırı bitişi, toplam makale).
- Örtüşen pencere: son başarılı turun bitişinden `overlap_minutes` (30) geri; en çok 3 gün.
- Rotasyon: her tur `queries_per_run` (18) sorgu çalışır, imleç `bi_settings.scan_cursor`'da. Başlangıç verisiyle 10 dilde 56 sorgu üretilir; saatlik turla tüm liste yaklaşık 3 saatte bir dolaşılır.
- Hata yönetimi: 5xx/ağ hatasında üstel bekleme (1, 2, 4 sn), 429'da sağlayıcı `Retry-After` süresince durdurulur, sağlayıcı başına 3 hatada o tur kesilir, zaman bütçesi 120 sn.
- Geri alma: `supabase/rollback/20261127190000_brand_intelligence.down.sql` (toplanan `bi_` verisini de siler).

### Yönetim paneli (`admin/index.html`)

Site yayında olduğunda adres: `https://kurnazrecep16-web.github.io/newspenguen/admin/`. Sayfa yalnızca arayüzdür; gizli anahtar içermez ve arama motorlarına kapalıdır (`noindex`). Giriş Supabase Auth ile yapılır, panel yalnızca `bi_staff` tablosundaki hesapları kabul eder. Asıl yetki veritabanında RLS ile uygulanır: editör, yöneticinin işlemlerini arayüzü atlatarak da yapamaz.

| Bölüm | Editör | Yönetici |
|---|---|---|
| Genel durum: KPI'lar, sağlayıcı sağlığı, tarama geçmişi, son hatalar, “Şimdi tara” | ✓ | ✓ |
| Editoryal kuyruk: durumlar, başlık düzeltmesi, kendi özetimiz, segment/konu/etiket/puan/ülke, marka rolleri, kaynak güvenilirliği, tekrar birleştirme, puan dökümü ve kanıt | ✓ | ✓ |
| Markalar: ekle/düzenle/sil, ana şirket, alternatif adlar (belirsiz, büyük/küçük harf, aramada), birleştirme | yalnızca görür | ✓ |
| Kaynaklar: API sağlayıcıları (aç/kapa, kota, aralık), RSS keşfi ve denemesi (`bi-admin`), yayıncı alan adı güvenilirliği | alan adları | ✓ |
| Arama ve kurallar: eşikler, ağırlıklar (toplamı 1 olmalı), yayın politikası, tarama, diller, terimler, sorgu önizlemesi | yalnızca görür | ✓ |
| Ekip: editör/yönetici ekleme, rol değiştirme | — | ✓ |

RLS bir değişikliği engellediğinde PostgREST hata yerine 0 satır döner; panel bunu başarı saymaz, “yetki yok” hatası gösterir.

`bi-admin` edge function (yalnızca ekip): `discover_feeds` (resmi sayfadaki RSS/Atom bağlantısını okur, adres tahmin etmez), `test_feed`, `preview_queries`. Yerel ağ adreslerine istek atmaz.

## 6. Testler

```bash
npm run test:bi      # 48 motor testi (Node 22, ek bağımlılık yok)
npm run test:bi-db   # yerel Postgres: migration + seed (2 kez) + RLS/bildirim/SoV testleri + geri alma + yeniden uygulama
```
Panel ve uygulama ekranları ayrıca Playwright ile yerel Postgres'e karşı denendi (RLS rolleriyle; 30 panel, 25 uygulama denetimi). Bu deneme düzeni repoda değil, çünkü PostgREST yerine küçük bir test köprüsü kullanıyor.
GitHub Actions: `.github/workflows/bi-tests.yml` (ikisi + edge function tip kontrolü).
Test verileri `example.*` alan adlı fixture'lardır; canlı haber değildir.

## 7. Aşama planı

| Faz | İçerik | Durum |
|---|---|---|
| 1 | Denetim | Tamam |
| 2 | Veri modeli, RLS, migration + geri alma, marka seed | Kod tamam, canlıya uygulanmadı |
| 3 | GDELT, TheNewsAPI, NewsAPI, RSS adaptörleri | Kod tamam; GDELT ve RSS anahtarsız, diğerleri anahtar bekliyor |
| 4 | Çok dilli dinamik sorgular, alias çözümleme | Tamam |
| 5 | Bağlam, segment, konu, puan, tekrar tespiti | Tamam (kural tabanlı; LLM katmanı isteğe bağlı, API anahtarı ve onay gerekir) |
| 6 | Yönetici paneli (marka, alias, kaynak, sorgu, editoryal kuyruk, sistem izleme) | Tamam (`admin/`), yerelde denendi |
| 7 | Uygulama: GBI bölümü, marka sayfaları, takip, bildirim tercihleri | Tamam (`app/gbi.js`); anlık bildirim (push) gönderimi yok, bildirimler uygulama içinde |
| 8 | Analitik: marka aktivitesi, Share of Voice ekranları | Tamam |
| 9 | Uçtan uca doğrulama (canlı ilk taramalar, kaynak URL kontrolü) | Migration onayından sonra |
| 10 | Dokümantasyon | Bu dosya; fazlarla güncellenecek |

Share of Voice tanımı: seçilen dönemde **yayımlanmış** GBI haberlerinde markanın geçtiği haber sayısı / karşılaştırılan markaların toplamı. Dolaylı geçişler (O) hariç. Bu **izlenen haberlerdeki görünürlük payıdır**; pazar payı veya ciro payı değildir ve dünyadaki tüm haberleri temsil etmez.
