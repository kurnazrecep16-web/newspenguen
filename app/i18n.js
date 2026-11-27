/* COATNEWS · Türkçe / English arayüz dili
   Arayüz Türkçe yazılır; İngilizce seçiliyse ekran her çizildiğinde görünen metinler
   ve placeholder/aria-label değerleri bu sözlükle çevrilir. Haber içerikleri (başlık,
   özet, "neden fırsat") kaynağın dilinde kalır, uydurma çeviri yapılmaz. */
(function () {
  "use strict";
  const KEY = "np5_lang";
  let lang = "tr";
  try { lang = JSON.parse(localStorage.getItem(KEY)) || "tr"; } catch (e) { }

  const D = {
    "Industry & Project Insights": "Industry & Project Insights",
    "Ana menü": "Main menu", "Atla": "Skip", "Devam Et": "Continue", "Başlayalım": "Get started",
    "Sektör haberleri, projeler ve yatırım fırsatları": "Industry news, projects and investment opportunities",
    "Endüstri, enerji, altyapı ve denizcilik projelerini tek platformda takip et.": "Follow industrial, energy, infrastructure and marine projects on one platform.",
    "Bölgendeki fırsatları ilk sen gör": "Be first to see opportunities in your region",
    "İl ya da bölge seç; ihaleler, yatırımlar ve finansman haberleri sana göre süzülsün.": "Pick a province or region; tenders, investments and financing news are filtered for you.",
    "Protective boya hesabı cebinde": "Protective paint calculator in your pocket",
    "Çelik tonajından yüzey alanını, katlardan boya miktarını ve maliyeti saniyeler içinde hesapla.": "Calculate surface area from steel tonnage, and paint quantity and cost from the coats, in seconds.",
    "Hesabına giriş yap": "Sign in to your account", "E-posta": "Email", "Şifre": "Password", "Şifremi unuttum": "Forgot password",
    "Giriş Yap": "Sign In", "Giriş yap": "Sign in", "veya": "or", "Apple ile giriş yap": "Sign in with Apple", "Misafir olarak devam et": "Continue as guest",
    "Hesabın yok mu?": "Don't have an account?", "Kayıt ol": "Sign up", "Kayıt Ol": "Sign Up", "Şifreyi göster": "Show password", "Geri": "Back",
    "Ad soyad": "Full name", "Ad Soyad": "Full name", "Şifre (en az 8 karakter)": "Password (at least 8 characters)",
    "Kullanım koşulları ve gizlilik politikasını": "I have read and accept the terms of use and privacy policy", "okudum, kabul ediyorum.": "",
    "Zaten hesabın var mı?": "Already have an account?",
    "Konum": "Location", "Tüm Türkiye ve Global": "All of Türkiye and Global", "Tümü": "All", "★ Bölgem": "★ My region", "Bölgem": "My region",
    "Toz Boya": "Powder", "Enerji": "Energy", "Boya Hesapla": "Paint Calculator", "Protective sarfiyat": "Protective consumption",
    "Proje Haritası": "Project Map", "Güncel Fırsatlar": "Latest Opportunities", "İhale": "Tender", "Yatırım": "Investment", "Finansman": "Financing", "Anlaşma": "Deal", "Haber": "News",
    "Segmentler nasıl çalışır?": "How do segments work?",
    "Her haber Marine, Protective, Powder, Decorative veya Energy segmentlerinden birine atanır. Haberler sekmesinden segment seçerek o alandaki içerikleri görebilirsin.": "Every story is assigned to one of Marine, Protective, Powder, Decorative or Energy. Pick a segment in the News tab to see its content.",
    "Dil nasıl değiştirilir?": "How do I change the language?",
    "Ana sayfadaki TR/EN düğmesinden ya da Daha Fazla › Dil · Language satırından. Haber başlık ve özetleri kaynağın dilinde kalır.": "Use the TR/EN button on the home screen or More › Dil · Language. Story titles and summaries stay in the source language.",
    "İçerik kaynakları": "Content sources",
    "Her haberin orijinal yayıncısı ve kaynak bağlantısı gösterilir. Özetler bilgilendirme amaçlıdır; asıl içerik ilgili yayıncıya aittir ve orijinal yayının yerine geçmez.": "Each story shows its original publisher and source link. Summaries are for information only; the content belongs to the publisher and does not replace the original.",
    "COATNEWS; boya ve kaplama sektöründeki haberleri, yatırımları, teknolojileri ve pazar gelişmelerini bağımsız editoryal bir yaklaşımla bir araya getiren çok dilli medya platformudur.": "COATNEWS is a multilingual media platform that brings together news, investments, technologies and market developments in paints and coatings with an independent editorial approach.",
    "Ana Sayfa": "Home", "Segmentler": "Segments", "Projeler": "Projects", "Hesapla": "Calculate", "Kayıtlı": "Saved", "Haberler": "News", "Daha Fazla": "More", "Segmentler ve konum": "Segments and location", "Proje Haritası": "Project Map", "Türkiye ve Marmara": "Türkiye and Marmara", "Profil ve hesap": "Profile and account", "Boya ve kaplama sektörünün haberleri": "News from the paint and coatings industry", "Marine, Protective, Powder, Decorative ve Energy segmentlerindeki projeleri ve yatırımları tek yerde takip et.": "Follow projects and investments across Marine, Protective, Powder, Decorative and Energy in one place.",
    "Yeni haberler": "New stories", "Profil": "Profile", "Filtre": "Filter", "Öne çıkanlar": "Highlights", "Kaydet": "Save", "Kayıttan çıkar": "Remove from saved", "Ara": "Search", "Paylaş": "Share",
    "Tüm içerik beş ana segmentte toplanır.": "All content is grouped into five core segments.",
    "Gemiler, tersaneler, offshore, limanlar ve deniz altyapısı": "Ships, shipyards, offshore, ports and marine infrastructure",
    "Korozyon koruma, çelik yapılar, tanklar, köprüler ve endüstriyel tesisler": "Corrosion protection, steel structures, tanks, bridges and industrial plants",
    "Mimari boyalar, iç ve dış cephe, renk ve yapı yüzeyleri": "Architectural paints, interior and exterior facades, colour and building surfaces",
    "Toz boya teknolojileri, uygulama hatları ve üretim yatırımları": "Powder coating technologies, application lines and production investments",
    "Rüzgar, güneş, santraller ve enerji altyapısı": "Wind, solar, power plants and energy infrastructure",
    "Devam Eden": "Ongoing", "Devam Ediyor": "Ongoing", "Planlanan": "Planned", "Harita": "Map", "Durum": "Status",
    "Türkiye": "Türkiye", "Ege": "Aegean", "Akdeniz": "Mediterranean", "İç Anadolu": "Central Anatolia", "Karadeniz": "Black Sea", "Doğu Anadolu": "Eastern Anatolia", "Güneydoğu Anadolu": "Southeastern Anatolia",
    "Haber sayısı": "Number of stories", "En çok haber olan iller": "Provinces with most stories", "Konum filtresi": "Location filter", "Türkiye proje haritası": "Türkiye project map", "Marmara proje haritası": "Marmara project map",
    "Temizle": "Clear", "Konum filtresi yok": "No location filter", "İstanbul + Trakya": "Istanbul + Thrace", "Yurt dışı projeler": "Projects abroad", "Bölgeler": "Regions",
    "Konum ara…": "Search location…", "Konum ara": "Search location",
    "Arama": "Search", "Örnek: demiryolu, Tekirdağ, rüzgar, ihale": "Example: railway, Tekirdağ, wind, tender", "Şirket, şehir veya konu ara": "Search company, city or topic",
    "Sonuç yok": "No results", "Başka bir kelime dene.": "Try another word.", "Son Haberler": "Latest Stories", "Yeni Haberler": "New Stories",
    "Son 48 saatte yeni haber yok. En son eklenenler:": "No new stories in the last 48 hours. Most recent:",
    "Protective Boya Hesapla": "Protective Paint Calculator",
    "Çelik tonajı ya da yüzey alanı, fire oranı ve boya katlarının bilgileriyle sarfiyatı ve maliyeti hesapla.": "Calculate consumption and cost from steel tonnage or surface area, loss rate and paint coat data.",
    "Tonajdan yüzey alanı (m²)": "Surface area from tonnage (m²)", "Kat bazında sarfiyat (L)": "Consumption per coat (L)", "Kuru ve yaş film kalınlığı": "Dry and wet film thickness", "Toplam boya miktarı ve maliyet ($)": "Total paint quantity and cost ($)",
    "Hesaplamaya Başla": "Start Calculation", "Yüzey Bilgisi": "Surface", "Sistem": "System", "Sonuç": "Result",
    "Yüzey bilgisini nasıl gireceksin?": "How will you enter the surface?", "Çelik tonajı": "Steel tonnage", "Yüzey alanı": "Surface area", "Çelik miktarı": "Steel quantity",
    "Profil tipi": "Profile type", "Ağır profil": "Heavy section", "HEB, HEM, kalın sac": "HEB, HEM, thick plate", "Orta profil": "Medium section", "Hafif profil": "Light section", "Köşebent, U, boru": "Angle, channel, tube", "İnce sac": "Thin plate", "Kafes, ince levha": "Lattice, thin sheet",
    "Ton başına yüzey (elle değiştirilebilir)": "Surface per tonne (editable)", "Hesaplanan yüzey alanı": "Calculated surface area", "Boyanacak yüzey alanı": "Surface area to paint",
    "Fire oranı (toplam kayıp)": "Loss rate (total loss)", "Toplam boya kaybı: yüzey pürüzlülüğü, profil şekli ve uygulama koşullarına göre değişir.": "Total paint loss: depends on surface roughness, profile shape and application conditions.",
    "Her boya katı için teknik föydeki değerleri gir. Kuru filmi ya da yaş filmi yaz, diğeri otomatik hesaplanır.": "Enter the values from the technical data sheet for each coat. Type dry or wet film; the other is calculated.",
    "Hacimce katı madde": "Volume solids", "Kat sayısı": "Number of coats", "kat": "coat", "Kuru film (DFT)": "Dry film (DFT)", "Yaş film (WFT)": "Wet film (WFT)", "Birim fiyat (isteğe bağlı)": "Unit price (optional)",
    "Kat ekle": "Add coat", "Kat adı": "Coat name", "Katı sil": "Delete coat", "En az bir kat olmalı": "At least one coat is required",
    "Hesaplama sonucu": "Calculation result", "Toplam boya miktarı": "Total paint quantity", "Yaklaşık maliyet": "Estimated cost", "Toplam DFT": "Total DFT", "Fire": "Loss", "m² maliyeti": "Cost per m²",
    "Kat bazında sarfiyat": "Consumption per coat", "Astar": "Primer", "Ara kat": "Intermediate", "Son kat": "Topcoat",
    "Çelik:": "Steel:", "Fire:": "Loss:", "Sarfiyat:": "Consumption:", "Düzenle": "Edit",
    "Teorik yayılma = katı madde × 10 ÷ DFT · Pratik yayılma = teorik × (1 − fire) · WFT = DFT × 100 ÷ katı madde. Ton başına yüzey profil boyutuna göre değişir; kesin alan için proje metrajını esas al.": "Theoretical spreading = volume solids × 10 ÷ DFT · Practical spreading = theoretical × (1 − loss) · WFT = DFT × 100 ÷ volume solids. Surface per tonne depends on section size; use the project's quantity take-off for exact area.",
    "Hesabı kaydet": "Save calculation", "Hesap adı": "Calculation name", "Kayıtlı hesaplar": "Saved calculations",
    "Kayıtlılar": "Saved", "Fırsatlar": "Opportunities", "Hesaplamalar": "Calculations", "Henüz kayıt yok": "Nothing saved yet",
    "Kartlardaki yer imine dokunarak buraya ekleyebilirsin.": "Tap the bookmark on a card to add it here.", "Kayıtlı hesap yok": "No saved calculations", "Hesap sonucunda Kaydet'e dokun.": "Tap Save on a calculation result.",
    "Misafir": "Guest", "Hesabınla giriş yaparak kayıtlarını sakla": "Sign in to keep your saved items",
    "Profil bilgileri": "Profile details", "Giriş yap veya kayıt ol": "Sign in or sign up", "Ad ve e-posta": "Name and email", "Bildirim tercihleri": "Notification preferences", "Bölge fırsatları, ihaleler": "Regional opportunities, tenders",
    "Uygulama ayarları": "App settings", "Uygulama Ayarları": "App Settings", "İlgi alanları ve konum": "Interests and location", "Yardım ve destek": "Help and support", "Yardım ve Destek": "Help and Support", "Sık sorulanlar, iletişim": "FAQ, contact",
    "Hakkında": "About", "Çıkış yap": "Sign out", "Dil": "Language",
    "İlgi alanların": "Your interests", "Kapattığın sektörler akışta görünmez.": "Segments you turn off are hidden from the feed.",
    "Haberler nereden geliyor?": "Where do the stories come from?",
    "COATNEWS, sektör yayınlarını ve kamu ihale duyurularını her 6 saatte bir tarar; boya ve kaplama ihtiyacı doğurabilecek projeleri 0–100 arası fırsat puanıyla listeler. 50 puanın altındakiler gösterilmez.": "COATNEWS scans industry publications and public tender notices every 6 hours and lists projects that may need paints and coatings with an opportunity score from 0 to 100. Stories below 50 are not shown.",
    "Konum filtresi nasıl çalışır?": "How does the location filter work?",
    "Haber metnindeki il, ilçe ve kurum adlarından konum bulunur (ör. Çorlu → Tekirdağ). Bölge ya da il seçerek akışı daraltabilirsin.": "Location is detected from province, district and agency names in the story (e.g. Çorlu → Tekirdağ). Pick a region or province to narrow the feed.",
    "Boya hesabı ne kadar kesin?": "How accurate is the paint calculation?",
    "Hesap; teknik föydeki hacimce katı madde ve film kalınlığıyla standart formülü kullanır. Ton başına yüzey değerleri tipiktir, kesin sonuç için proje metrajını kullan.": "It uses the standard formula with volume solids and film thickness from the data sheet. Surface-per-tonne values are typical; use the project take-off for exact results.",
    "İletişim": "Contact", "Destek e-postası:": "Support email:",
    "Gizlilik politikası ve kullanım koşulları": "Privacy policy and terms of use", "Gizlilik ve Koşullar": "Privacy and Terms", "Gizlilik politikası": "Privacy policy", "Kullanım koşulları": "Terms of use",
    "Veri: kamuya açık haber ve ihale kaynakları. Haber içerikleri ilgili yayıncılara aittir.": "Data: public news and tender sources. Story content belongs to the respective publishers.",
    "COATNEWS reklam veya takip amaçlı veri toplamaz. Kayıtlı haberlerin, hesapların, konum ve ilgi alanı tercihlerin yalnızca cihazında saklanır. Hesap açarsan adın ve e-posta adresin, kimlik doğrulama için güvenli bir sunucuda (Supabase) tutulur ve üçüncü taraflarla paylaşılmaz.": "COATNEWS does not collect data for advertising or tracking. Your saved stories, calculations, location and interest preferences are stored only on your device. If you create an account, your name and email are kept on a secure server (Supabase) for authentication and are not shared with third parties.",
    "Hesabını ve verilerini silmek için destek adresine yazabilirsin; talebin 30 gün içinde yerine getirilir.": "To delete your account and data, write to the support address; requests are completed within 30 days.",
    "Boya hesapları tahmini değerlerdir; uygulama öncesi ürün teknik föyü ve proje spesifikasyonu esas alınmalıdır.": "Paint calculations are estimates; the product data sheet and project specification must govern before application.",
    "/100 fırsat puanı": "/100 opportunity score", "Genel": "Overview", "Detay": "Details", "Doküman": "Documents", "Son teklif tarihi": "Bid deadline", "Tür": "Type", "Boya segmenti": "Paint segment", "Segment": "Segment",
    "Neden fırsat": "Why it's an opportunity", "Orijinal haberi oku": "Read the original story", "Hedef tarih": "Target date", "Yayın tarihi": "Published", "Orijinal haber": "Original story", "Diğer kaynak": "Other source",
    "Kapat": "Close", "Bildirimler App Store sürümünde açılacak; tercihlerin şimdiden kaydedilir.": "Notifications arrive with the App Store release; your preferences are saved now.",
    "Bölgemdeki fırsatlar": "Opportunities in my region", "75+ puanlı bölge haberleri": "Regional stories scoring 75+", "Yaklaşan ihaleler": "Upcoming tenders", "Son teklife 10 günden az kalanlar": "Less than 10 days to bid deadline",
    "Haftalık özet": "Weekly digest", "Pazartesi sabahı": "Monday morning",
    "Proje bulunamadı": "Project not found", "Haber bulunamadı": "Story not found", "Bu filtrede haber yok": "No stories for this filter", "Konumu ya da filtreyi değiştir.": "Change the location or filter.",
    "Bu filtrede fırsat yok": "No opportunities for this filter", "Bu durumda proje yok": "No projects with this status", "İlgili haberler": "Related stories",
    "Kaydedildi": "Saved", "Kayıtlardan çıkarıldı": "Removed from saved", "Konum filtresi uygulandı": "Location filter applied", "Tüm konumlar gösteriliyor": "Showing all locations",
    "Hesap Kayıtlılar'a eklendi": "Calculation added to Saved", "Hesap silindi": "Calculation deleted", "Panoya kopyalandı": "Copied to clipboard", "Çıkış yapıldı": "Signed out", "Profil güncellendi": "Profile updated",
    "Hesabın oluşturuldu": "Your account was created", "Onay bağlantısı e-postana gönderildi": "A confirmation link was sent to your email", "Sıfırlama bağlantısı e-postana gönderildi": "A reset link was sent to your email",
    "Apple ile giriş, App Store sürümünde açılacak": "Sign in with Apple arrives with the App Store release",
    "Geçerli bir e-posta yaz.": "Enter a valid email.", "Şifre en az 8 karakter olmalı.": "Password must be at least 8 characters.", "Şifreni yaz.": "Enter your password.", "Adını yaz.": "Enter your name.",
    "Devam etmek için koşulları kabul et.": "Accept the terms to continue.", "E-posta ya da şifre hatalı.": "Incorrect email or password.", "Bu e-posta ile zaten bir hesap var.": "An account with this email already exists.",
    "Bağlantı kurulamadı. İnternetini kontrol et.": "Could not connect. Check your internet.", "Şifre sıfırlama için önce e-postanı yaz.": "Enter your email first to reset your password.",
    "Uygula": "Apply", "Kapat ": "Close ", "Paylaşım bu cihazda desteklenmiyor": "Sharing isn't supported on this device"
  };
  const MON = { Oca: "Jan", Şub: "Feb", Mar: "Mar", Nis: "Apr", May: "May", Haz: "Jun", Tem: "Jul", Ağu: "Aug", Eyl: "Sep", Eki: "Oct", Kas: "Nov", Ara: "Dec" };
  const REGN = { "Marmara": "Marmara", "Ege": "Aegean", "Akdeniz": "Mediterranean", "İç Anadolu": "Central Anatolia", "Karadeniz": "Black Sea", "Doğu Anadolu": "Eastern Anatolia", "Güneydoğu Anadolu": "Southeastern Anatolia" };
  const reg = r => REGN[r] || r;
  const PAT = [
    [/^(\d+) haber$/, (m, n) => n + (n === "1" ? " story" : " stories")],
    [/^(\d+) haber · (\d+) hesap$/, (m, a, b) => a + " stories · " + b + " calculations"],
    [/^Sürüm (\S+) · (.+)$/, (m, v, r) => "Version " + v + " · " + r],
    [/^Sürüm (\S+), gizlilik$/, (m, v) => "Version " + v + ", privacy"],
    [/^(\d+) haber · (\d+) il seçili$/, (m, a, b) => a + " stories · " + b + " provinces selected"],
    [/^Uygula · (\d+) haber$/, (m, n) => "Apply · " + n + " stories"],
    [/^(\d+) konumlu haber$/, (m, n) => n + " located stories"],
    [/^(.+), (\d+) haber$/, (m, c, n) => c + ", " + n + " stories"],
    [/^(.+) · (\d+) haber$/, (m, c, n) => c + " · " + n + " stories"],
    [/^(.+) · en yüksek ★(\d+)$/, (m, a, n) => (D[a] !== undefined ? D[a] : reg(a)) + " · top ★" + n],
    [/^(.+) bölgesinin tümü$/, (m, r) => "All of " + reg(r)],
    [/^Global: (\d+)$/, (m, n) => "Global: " + n],
    [/^Son güncelleme: (.+) · 50\+ fırsat puanlı haberler$/, (m, d) => "Last update: " + d + " · stories scoring 50+"],
    [/^Son veri güncellemesi: (.+)$/, (m, d) => "Last data update: " + d],
    [/^Sürüm (.+) · Industry & Project Insights$/, (m, v) => "Version " + v + " · Industry & Project Insights"],
    [/^Sürüm (.+), gizlilik$/, (m, v) => "Version " + v + ", privacy"],
    [/^(\d+) dk okuma$/, (m, n) => n + " min read"],
    [/^(\d+) gün önce$/, (m, n) => n + " days ago"], [/^bugün$/, () => "today"], [/^dün$/, () => "yesterday"],
    [/^(\d{1,2}) (Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara) (\d{4})$/, (m, d, mo, y) => d + " " + MON[mo] + " " + y],
    [/^Orijinal haber · (\d{1,2}) (\S+) (\d{4})$/, (m, d, mo, y) => "Original story · " + d + " " + (MON[mo] || mo) + " " + y],
    [/^(\d+) m²\/ton$/, (m, n) => n + " m²/tonne"], [/^m²\/ton$/, () => "m²/tonne"],
    [/^(\d+)\. (Astar|Ara kat|Son kat)$/, (m, n, k) => n + ". " + D[k]],
    [/^%(\d+(?:,\d+)?)$/, (m, v) => v + "%"],
    [/^Kat (\d+)$/, (m, n) => "Coat " + n],
    [/^Pratik (.+)$/, (m, v) => "Practical " + v],
    [/^KM %(.+)$/, (m, v) => "VS " + v + "%"],
    [/^Hoş geldin, (.+)$/, (m, n) => "Welcome, " + n],
    [/^Kayıtlı hesaplar \((\d+)\)$/, (m, n) => "Saved calculations (" + n + ")"],
    [/^Hesap · (.+)$/, (m, v) => "Calculation · " + v]
  ];
  function tr(s) {
    const t = s.trim(); if (!t) return null;
    if (Object.prototype.hasOwnProperty.call(D, t)) return s.replace(t, D[t]);
    if (REGN[t]) return s.replace(t, REGN[t]);
    for (const [rx, f] of PAT) { const m = t.match(rx); if (m) return s.replace(t, f(...m)); }
    return null;
  }
  const SKIP = ".ncard h3,.pcard h3,.slide h3,.slide p,.dtitle,.body,.why p,.rel b,.lname,.prose .keep,input,textarea,script,style";
  function apply(root) {
    if (lang !== "en") return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; const todo = [];
    while ((n = w.nextNode())) { if (n.parentElement && !n.parentElement.closest(SKIP)) todo.push(n); }
    for (const x of todo) { const r = tr(x.nodeValue); if (r !== null && r !== x.nodeValue) x.nodeValue = r; }
    (root.querySelectorAll ? root.querySelectorAll("[placeholder],[aria-label]") : []).forEach(e => {
      for (const k of ["placeholder", "aria-label"]) { const v = e.getAttribute(k); if (v) { const r = tr(v); if (r !== null && r !== v) e.setAttribute(k, r); } }
    });
  }
  let busy = false;
  const mo = new MutationObserver(() => { if (busy || lang !== "en") return; busy = true; try { apply(document.body); } finally { mo.takeRecords(); busy = false; } });
  function start() { mo.observe(document.body, { childList: true, subtree: true, characterData: true }); document.documentElement.lang = lang; apply(document.body); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.NPLang = {
    get: () => lang,
    set(l) { lang = l === "en" ? "en" : "tr"; try { localStorage.setItem(KEY, JSON.stringify(lang)); } catch (e) { } document.documentElement.lang = lang; if (window.NPApp && NPApp.rerender) NPApp.rerender(); else location.reload(); },
    t: s => (lang === "en" ? (tr(s) ?? s) : s)
  };
})();
