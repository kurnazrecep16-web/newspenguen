/* =========================================================
   COATNEWS iOS uygulaması · v2 (Premium Dark)
   Veri: data.js (sitedeki index.html'den derlemede çıkarılır) + Supabase canlı akış.
   Ekranlar: açılış, onboarding, giriş, kayıt, ana sayfa, fırsatlar, sektörler, projeler,
   proje detayı, haber detayı, konum, proje haritası, hesaplama (giriş, yüzey, sistem, sonuç),
   kayıtlılar, profil ve ayarlar, arama, yeni haberler.
   ========================================================= */
(function () {
  "use strict";
  const SUPA_URL = "https://qpwkiauhazpyaywjderc.supabase.co", SUPA_KEY = "sb_publishable_eDv33WBVXDj1bmVkNS3Pxw_-4Cn_iPj";
  const MINSCORE = 50, VERSION = "2.0";
  const NS = window.NPScenes;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lc = s => String(s || "").toLocaleLowerCase("tr");
  const store = {
    get(k, d) { try { const v = localStorage.getItem("np5_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("np5_" + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem("np5_" + k); } catch (e) { } }
  };

  /* ---------- İkonlar (24 px, 2 px çizgi) ---------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.5M8.5 18h.01M12 18h.01"/>',
    bm: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    chev: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 18-6-6 6-6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    map: '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    factory: '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
    road: '<path d="M4 21 9 3M20 21 15 3M12 6v2M12 11v2M12 16v3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    ship: '<path d="M3 17h18l-2.5 4h-13z"/><path d="M5 17V11h14v6M9 11V7h6v4M12 7V3"/>',
    flask: '<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    roller: '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h2.5v5.5H11V15"/><rect x="9.5" y="15" width="3" height="6" rx="1"/>',
    swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    apple: '<path fill="currentColor" stroke="none" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'
  };
  const ic = (n, c = "ic") => '<svg class="' + c + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || "") + '</svg>';
  const MARK = (cls = "mark") => '<svg class="' + cls + '" viewBox="0 0 64 64" aria-hidden="true"><defs> <linearGradient id="cnTop" x1="8" y1="6" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4DB8FF"/><stop offset="1" stop-color="#8FD6FF"/></linearGradient> <linearGradient id="cnMid" x1="6" y1="24" x2="58" y2="42" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0066FF"/><stop offset="1" stop-color="#2E8BFF"/></linearGradient> <linearGradient id="cnBot" x1="10" y1="40" x2="54" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#123B8C"/><stop offset="1" stop-color="#0B2A66"/></linearGradient> <radialGradient id="cnHi" cx="22" cy="16" r="30" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient> <clipPath id="cnClip"><circle cx="32" cy="32" r="28"/></clipPath> </defs> <g clip-path="url(#cnClip)"> <rect x="0" y="0" width="64" height="64" fill="url(#cnBot)"/> <path d="M0 42C14 30 30 50 64 34V0H0Z" fill="url(#cnMid)"/> <path d="M0 26C16 12 32 32 64 16V0H0Z" fill="url(#cnTop)"/> <path d="M0 26C16 12 32 32 64 16" stroke="#0B1F3B" stroke-width="2.6" fill="none"/> <path d="M0 42C14 30 30 50 64 34" stroke="#0B1F3B" stroke-width="2.6" fill="none"/> <circle cx="32" cy="32" r="28" fill="url(#cnHi)"/> </g></svg>';

  /* ---------- Sektörler (konuya göre) ---------- */
  /* Beş ana segment (haberin seg alanı) */
  const SECTORS = {
    marine: { n: "Marine Coatings", d: "Gemiler, tersaneler, offshore, limanlar ve deniz altyapısı", i: "ship", c: "var(--seg-marine)" },
    prot: { n: "Protective Coatings", d: "Korozyon koruma, çelik yapılar, tanklar, köprüler ve endüstriyel tesisler", i: "factory", c: "var(--seg-prot)" },
    powder: { n: "Powder Coatings", d: "Toz boya teknolojileri, uygulama hatları ve üretim yatırımları", i: "box", c: "var(--seg-powder)" },
    deco: { n: "Decorative Coatings", d: "Mimari boyalar, iç ve dış cephe, renk ve yapı yüzeyleri", i: "drop", c: "var(--seg-deco)" },
    energy: { n: "Energy", d: "Rüzgar, güneş, santraller ve enerji altyapısı", i: "bolt", c: "var(--seg-energy)" }
  };
  const SEC_KEYS = Object.keys(SECTORS);
  const TOPIC_SECTOR = { rail: "infra", bridge: "infra", tunnel: "infra", road: "infra", water: "infra", airport: "infra", wind: "energy", solar: "energy", grid: "energy", plant: "energy", offshore: "energy", port: "marine", ship: "marine", refinery: "petro", pipeline: "petro", tank: "petro", factory: "industry", steel: "industry", building: "building" };
  const KIND = { tender: "İhale", investment: "Yatırım", finance: "Finansman", deal: "Anlaşma" };
  const PAINT = { marine: "Marine", prot: "Protective", deco: "Decorative", powder: "Toz Boya", energy: "Enerji" };

  /* ---------- Konum: bölgeler, iller, koordinatlar ---------- */
  const REGIONS = [
    ["Marmara", ["İstanbul", "Edirne", "Kırklareli", "Tekirdağ", "Çanakkale", "Kocaeli", "Yalova", "Sakarya", "Bilecik", "Bursa", "Balıkesir"]],
    ["Ege", ["İzmir", "Manisa", "Aydın", "Denizli", "Muğla", "Afyonkarahisar", "Kütahya", "Uşak"]],
    ["Akdeniz", ["Antalya", "Isparta", "Burdur", "Mersin", "Adana", "Hatay", "Osmaniye", "Kahramanmaraş"]],
    ["İç Anadolu", ["Ankara", "Konya", "Karaman", "Aksaray", "Niğde", "Nevşehir", "Kırşehir", "Kırıkkale", "Kayseri", "Sivas", "Yozgat", "Çankırı", "Eskişehir"]],
    ["Karadeniz", ["Zonguldak", "Karabük", "Bartın", "Kastamonu", "Sinop", "Samsun", "Ordu", "Giresun", "Trabzon", "Rize", "Artvin", "Gümüşhane", "Bayburt", "Tokat", "Amasya", "Çorum", "Bolu", "Düzce"]],
    ["Doğu Anadolu", ["Erzurum", "Erzincan", "Kars", "Ardahan", "Iğdır", "Ağrı", "Van", "Muş", "Bitlis", "Bingöl", "Elazığ", "Malatya", "Tunceli", "Hakkari"]],
    ["Güneydoğu Anadolu", ["Gaziantep", "Kilis", "Adıyaman", "Şanlıurfa", "Diyarbakır", "Mardin", "Batman", "Siirt", "Şırnak"]]
  ];
  const GLOBAL = "Global", MINE = ["İstanbul", "Tekirdağ", "Edirne", "Kırklareli"];
  const COORD = { "İstanbul": [41.01, 28.97], "Edirne": [41.68, 26.56], "Kırklareli": [41.73, 27.22], "Tekirdağ": [40.98, 27.51], "Çanakkale": [40.15, 26.41], "Kocaeli": [40.77, 29.92], "Yalova": [40.65, 29.27], "Sakarya": [40.78, 30.4], "Bilecik": [40.14, 29.98], "Bursa": [40.19, 29.06], "Balıkesir": [39.65, 27.88], "İzmir": [38.42, 27.14], "Manisa": [38.61, 27.43], "Aydın": [37.85, 27.85], "Denizli": [37.78, 29.09], "Muğla": [37.22, 28.36], "Afyonkarahisar": [38.76, 30.54], "Kütahya": [39.42, 29.98], "Uşak": [38.68, 29.41], "Antalya": [36.9, 30.71], "Isparta": [37.76, 30.55], "Burdur": [37.72, 30.29], "Mersin": [36.81, 34.64], "Adana": [37.0, 35.32], "Hatay": [36.2, 36.16], "Osmaniye": [37.07, 36.25], "Kahramanmaraş": [37.58, 36.94], "Ankara": [39.93, 32.86], "Konya": [37.87, 32.48], "Karaman": [37.18, 33.22], "Aksaray": [38.37, 34.03], "Niğde": [37.97, 34.68], "Nevşehir": [38.62, 34.71], "Kırşehir": [39.15, 34.17], "Kırıkkale": [39.85, 33.51], "Kayseri": [38.73, 35.49], "Sivas": [39.75, 37.02], "Yozgat": [39.82, 34.81], "Çankırı": [40.6, 33.62], "Eskişehir": [39.78, 30.52], "Zonguldak": [41.45, 31.79], "Karabük": [41.2, 32.62], "Bartın": [41.63, 32.34], "Kastamonu": [41.38, 33.78], "Sinop": [42.03, 35.15], "Samsun": [41.29, 36.33], "Ordu": [40.98, 37.88], "Giresun": [40.91, 38.39], "Trabzon": [41.0, 39.72], "Rize": [41.02, 40.52], "Artvin": [41.18, 41.82], "Gümüşhane": [40.46, 39.48], "Bayburt": [40.26, 40.23], "Tokat": [40.31, 36.55], "Amasya": [40.65, 35.83], "Çorum": [40.55, 34.95], "Bolu": [40.74, 31.61], "Düzce": [40.84, 31.16], "Erzurum": [39.9, 41.27], "Erzincan": [39.75, 39.49], "Kars": [40.6, 43.1], "Ardahan": [41.11, 42.7], "Iğdır": [39.92, 44.04], "Ağrı": [39.72, 43.05], "Van": [38.49, 43.38], "Muş": [38.74, 41.49], "Bitlis": [38.4, 42.11], "Bingöl": [38.88, 40.5], "Elazığ": [38.67, 39.22], "Malatya": [38.35, 38.31], "Tunceli": [39.11, 39.55], "Hakkari": [37.58, 43.74], "Gaziantep": [37.07, 37.38], "Kilis": [36.72, 37.12], "Adıyaman": [37.76, 38.28], "Şanlıurfa": [37.16, 38.79], "Diyarbakır": [37.91, 40.24], "Mardin": [37.31, 40.74], "Batman": [37.89, 41.13], "Siirt": [37.93, 41.94], "Şırnak": [37.52, 42.46] };
  const ALIAS = {
    "İstanbul": ["ibb", "iski", "i̇bb", "i̇ski", "çatalca", "silivri", "arnavutköy", "hadımköy", "beyoğlu", "başakşehir", "bayrampaşa", "esenyurt", "büyükçekmece", "küçükçekmece", "avcılar", "beylikdüzü", "eyüpsultan", "sarıyer", "kağıthane", "şişli", "mecidiyeköy", "fatih", "zeytinburnu", "bakırköy", "bağcılar", "güngören", "esenler", "sultangazi", "gaziosmanpaşa", "kadıköy", "üsküdar", "ataşehir", "ümraniye", "maltepe", "kartal", "pendik", "tuzla", "beykoz", "çekmeköy", "sancaktepe", "sultanbeyli", "şile", "avrupa yakası", "anadolu yakası", "asya yakası", "kuzey demir", "inrail"],
    "Tekirdağ": ["çorlu", "çerkezköy", "kapaklı", "ergene", "velimeşe", "hayrabolu", "malkara", "süleymanpaşa", "marmaraereğlisi", "şarköy", "muratlı", "saray"],
    "Edirne": ["keşan", "uzunköprü", "ipsala", "enez", "havsa", "yenimuhacir"],
    "Kırklareli": ["lüleburgaz", "babaeski", "vize", "pınarhisar", "demirköy"],
    "Kocaeli": ["gebze", "dilovası", "izmit", "i̇zmit", "körfez", "derince", "gölcük", "kartepe", "darıca", "çayırova", "şekerpınar", "başiskele", "uzmar"],
    "Bursa": ["gemlik", "inegöl", "mudanya", "mustafakemalpaşa", "nilüfer", "osmangazi", "orhangazi", "orhaneli"],
    "Balıkesir": ["bandırma", "edremit", "ayvalık", "gönen"], "Çanakkale": ["biga", "lapseki", "gelibolu"], "Sakarya": ["adapazarı", "hendek", "karasu"],
    "İzmir": ["aliağa", "bergama", "torbalı", "kemalpaşa", "menemen", "çiğli", "star rafineri"], "Aydın": ["söke", "kuşadası", "nazilli", "didim", "buharkent", "kuyucak", "çıldır"],
    "Muğla": ["bodrum", "fethiye", "marmaris", "milas", "dalaman"], "Mersin": ["tarsus", "silifke", "erdemli", "akkuyu"], "Hatay": ["iskenderun", "antakya", "dörtyol"],
    "Adana": ["ceyhan", "yumurtalık", "kozan"], "Şanlıurfa": ["birecik", "siverek", "viranşehir"], "Antalya": ["alanya", "manavgat", "kemer", "gazipaşa", "mahmutlar"],
    "Zonguldak": ["çaycuma"], "Kayseri": ["incesu", "melikgazi"], "Konya": ["ılgın", "sarayönü"], "Ankara": ["kahramankazan"], "Kütahya": ["simav"], "Malatya": ["darende"], "Samsun": ["ladik", "havza"], "Eskişehir": ["türasaş"]
  };
  const CITY_REGION = {};
  REGIONS.forEach(([r, cs]) => cs.forEach(c => (CITY_REGION[c] = r)));
  const LTR = "a-zçğıöşüâîû";
  const wordRx = w => new RegExp("(^|[^" + LTR + "])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![" + LTR + "])");
  const MATCHERS = Object.keys(CITY_REGION).map(c => [c, [lc(c)].concat(ALIAS[c] || []).map(wordRx)]);
  function citiesOf(i) {
    if (i.reg && i.reg !== "tr") return [GLOBAL];
    const t = lc((i.company || "") + " " + i.title + " " + (i.summary || ""));
    const out = [];
    for (const [c, rxs] of MATCHERS) if (rxs.some(rx => rx.test(t))) out.push(c);
    return out;
  }

  /* ---------- Veri ---------- */
  const planned = i => /çed|planlan|mutabakat|hedef|kurulacak|planned|plans|ihale|tender|teklif|halkın görüş/i.test((i.title || "") + " " + (i.summary || "") + " " + (i.company || ""));
  function enrich(i) {
    i._t = NS.topicOf(i); i._s = SECTORS[i.seg] ? i.seg : (TOPIC_SECTOR[i._t] === "energy" ? "energy" : TOPIC_SECTOR[i._t] === "marine" ? "marine" : "prot"); i._c = citiesOf(i); i._p = planned(i);
    i._isProject = i.project === true || i.kind === "investment" || /proje|inşaat|yapım|tesis/i.test(i.company || "");
    return i;
  }
  const RAW = (typeof ITEMS !== "undefined" ? ITEMS : []).filter(i => (+i.score || 0) >= MINSCORE);
  let DATA = RAW.map(enrich);
  const UPD = typeof UPDATED !== "undefined" ? UPDATED : "";
  const pD = d => /^\d{4}-\d{2}-\d{2}/.test(d || "") ? new Date(d.slice(0, 10) + "T12:00:00Z") : null;
  const ts = i => { const x = pD(i.date); return x ? x.getTime() : 0; };
  const byScore = (a, b) => (b.score - a.score) || ((b.star ? 1 : 0) - (a.star ? 1 : 0)) || (ts(b) - ts(a));
  const byDate = (a, b) => (ts(b) - ts(a)) || (b.score - a.score);
  const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const fdate = d => { const x = pD(d); return x ? x.getUTCDate() + " " + MONTHS[x.getUTCMonth()] + " " + x.getUTCFullYear() : (d || ""); };
  function rel(d) { const x = pD(d); if (!x) return d || ""; const n = Math.floor((Date.now() - x) / 864e5); if (n <= 0) return "bugün"; if (n === 1) return "dün"; if (n < 14) return n + " gün önce"; return fdate(d); }
  const get = id => DATA.find(i => i.id === id);
  const readMin = i => Math.max(1, Math.round(((i.summary || "").split(/\s+/).length + (i.why || "").split(/\s+/).length) / 180) + 1);

  // Supabase canlı akış (son 30 gün, 50+ puan)
  (function live() {
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    fetch(SUPA_URL + "/rest/v1/news_items?select=id,seg,reg,lang,kind,star,title,summary,source,date,url,deadline,project,score,company,why&hidden=eq.false&score=gte." + MINSCORE + "&date=gte." + since + "&order=date.desc&limit=400", { headers: { apikey: SUPA_KEY } })
      .then(r => r.ok ? r.json() : []).then(rows => {
        const urls = new Set(DATA.map(i => i.url)); let n = 0;
        for (const r of rows || []) {
          if (!r.url || urls.has(r.url)) continue; urls.add(r.url);
          DATA.push(enrich({ id: String(r.id), seg: r.seg, reg: r.reg, lang: r.lang, kind: r.kind || null, star: !!r.star, score: +r.score, company: r.company || "", why: r.why || "", title: r.title, summary: r.summary || "", source: r.source, date: (r.date || "").slice(0, 10), url: r.url, deadline: r.deadline || null, project: !!r.project, isNew: (Date.now() - Date.parse(r.date)) < 2 * 864e5 })); n++;
        }
        if (n && ["home", "opps", "projects", "sectors", "map"].includes(cur().name)) render();
      }).catch(() => { });
  })();

  /* ---------- Durum ---------- */
  const S = {
    saved: store.get("saved", []), calcs: store.get("calcs", []), hidden: store.get("hidden", []), loc: new Set(store.get("loc", [])),
    user: store.get("user", null), session: store.get("session", null), onboarded: store.get("onboarded", false),
    notif: store.get("notif", { region: true, tender: true, weekly: false }),
    stack: [], seg: "all", kind: "all", proj: "all", savedTab: "opps", q: ""
  };
  const visible = () => DATA.filter(i => !S.hidden.includes(i._s) && (!S.loc.size || i._c.some(c => S.loc.has(c))));
  const isSaved = id => S.saved.includes(id);
  function toggleSave(id) { S.saved = isSaved(id) ? S.saved.filter(x => x !== id) : [id, ...S.saved]; store.set("saved", S.saved); toast(isSaved(id) ? "Kaydedildi" : "Kayıtlardan çıkarıldı"); }
  function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 1900); }
  const displayName = () => (S.user && S.user.name) || "Misafir";
  const initials = () => { const n = displayName().trim(); if (!S.user) return ic("user", "ic"); return esc(n.split(/\s+/).map(x => x[0]).slice(0, 2).join("").toLocaleUpperCase("tr")); };

  /* ---------- Yönlendirme ---------- */
  const TAB_OF = { home: "home", opps: "sectors", news: "home", search: "home", sectors: "sectors", projects: "projects", map: "projects", calc: "calc", saved: "more", more: "more" };
  const NO_TAB = ["splash", "onboarding", "login", "signup", "project", "news", "location", "calcSurface", "calcSystem", "calcResult", "profile", "legal", "notifs", "help", "about", "settings"];
  const cur = () => S.stack[S.stack.length - 1] || { name: "home", p: {} };
  function go(name, p = {}, opt = {}) {
    if (opt.root) S.stack = [];
    else if (opt.replace) S.stack.pop();
    S.stack.push({ name, p, y: 0 });
    render("fwd"); window.scrollTo(0, 0);
  }
  function back() {
    if (S.stack.length > 1) { S.stack.pop(); render("back"); window.scrollTo(0, cur().y || 0); }
    else go("home", {}, { root: true });
  }
  function tab(name) { S.stack = [{ name, p: {} }]; render(); window.scrollTo(0, 0); }

  /* ---------- Ortak bileşenler ---------- */
  const tag = i => '<span class="tag" style="--c:' + SECTORS[i._s].c + '">' + SECTORS[i._s].n + '</span>';
  const bmBtn = (i, cls = "bm") => '<button class="' + cls + '" data-save="' + esc(i.id) + '" aria-pressed="' + isSaved(i.id) + '" aria-label="' + (isSaved(i.id) ? "Kayıttan çıkar" : "Kaydet") + '">' + ic("bm") + '</button>';
  const scene = (i, k = "") => NS.sceneSVG(i._t, i.id + k);
  const place = i => i._c[0] === GLOBAL ? "Global" : i._c.length ? i._c.slice(0, 2).join(" · ") : "Türkiye";
  function ncard(i) {
    return '<article class="ncard"><button class="thumb" data-open="' + esc(i.id) + '" aria-label="' + esc(i.company || i.title) + '">' + scene(i) + '</button>' +
      '<button class="b" data-open="' + esc(i.id) + '" style="text-align:left">' + '<span>' + tag(i) + '</span><h3>' + esc(i.company || i.title) + '</h3>' +
      '<span class="meta"><span class="score">★ ' + i.score + '</span><span class="sep"></span><span>' + esc(place(i)) + '</span><span class="sep"></span><span>' + (KIND[i.kind] || rel(i.date)) + '</span></span></button>' + bmBtn(i) + '</article>';
  }
  function pcard(i) {
    return '<article class="pcard"><button class="thumb" data-open="' + esc(i.id) + '" aria-label="' + esc(i.company || i.title) + '">' + scene(i) + '</button>' +
      '<button data-open="' + esc(i.id) + '" style="text-align:left;min-width:0"><h3>' + esc(i.company || i.title) + '</h3><span class="meta"><span class="score">★ ' + i.score + '</span><span class="sep"></span><span>' + SECTORS[i._s].n + '</span></span>' +
      '<span class="meta" style="margin-top:4px"><span class="status" style="--st:' + (i._p ? "var(--np-amber-400)" : "var(--np-green-400)") + '">' + (i._p ? "Planlanan" : "Devam Ediyor") + '</span><span class="sep"></span><span>' + esc(place(i)) + '</span></span></button>' + bmBtn(i) + '</article>';
  }
  const empty = (t, s, icon = "search") => '<div class="empty">' + ic(icon) + '<b>' + t + '</b>' + (s || "") + '</div>';
  const nav = (title, right = "", opt = {}) => '<header class="navbar"><div class="navrow">' + (opt.noBack ? "" : '<button class="iconbtn" data-back="1" aria-label="Geri">' + ic("left") + '</button>') + (opt.large ? '<span class="sp"></span>' : '<h1 class="ntitle">' + esc(title) + '</h1>') + (right || (opt.noBack ? "" : '<span style="width:44px"></span>')) + '</div>' + (opt.large ? '<h1 class="ltitle">' + esc(title) + '</h1>' : '') + (opt.extra || "") + '</header>';
  const tabNav = (title, right = "", extra = "") => '<header class="navbar"><div class="navrow">' + (S.stack.length > 1 ? '<button class="iconbtn" data-back="1" aria-label="Geri">' + ic("left") + '</button>' : '') + '<h1 class="ltitle" style="flex:1;margin:0">' + esc(title) + '</h1>' + right + '</div>' + extra + '</header>';
  function locLabel() {
    if (!S.loc.size) return "Tüm Türkiye ve Global";
    const full = REGIONS.filter(([, cs]) => cs.every(c => S.loc.has(c))).map(([r]) => r);
    const rest = [...S.loc].filter(c => !full.includes(CITY_REGION[c]));
    const parts = full.concat(rest);
    return parts.length <= 2 ? parts.join(", ") : parts.slice(0, 2).join(", ") + " +" + (parts.length - 2);
  }
  const locBar = () => '<button class="locbar' + (S.loc.size ? " on" : "") + '" data-go="location">' + ic("pin") + '<span><small>Konum</small><b>' + esc(locLabel()) + '</b></span>' + ic("chev", "ic sm") + '</button>';

  const langPill = (st = "") => '<button class="langpill" data-act="lang" aria-label="Dil · Language" style="' + st + '">' + ic("globe", "ic xs") + (window.NPLang && NPLang.get() === "en" ? "EN" : "TR") + '</button>';

  /* =========================================================
     EKRANLAR
     ========================================================= */
  const V = {};

  // 1 · Açılış
  V.splash = () => '<div class="splash"><div>' + MARK() + '<h1>COAT<span style="color:var(--np-amber-400)">NEWS</span></h1><p>Global Coatings Media</p><p style="margin-top:14px;font-size:14px;opacity:.8">The Global Voice of the Coatings Industry.</p></div>' +
    '<svg class="swoosh" viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120 C120 60 260 70 400 10" stroke="#0066FF" stroke-width="3" fill="none" opacity=".7"/><path d="M0 135 C140 80 260 90 400 40" stroke="#4DB8FF" stroke-width="1.5" fill="none" opacity=".45"/></svg></div>';

  // 2 · Onboarding
  const ONB = [
    { t: "ship", h: "Boya ve kaplama sektörünün haberleri", p: "Marine, Protective, Powder, Decorative ve Energy segmentlerindeki projeleri ve yatırımları tek yerde takip et." },
    { t: "wind", h: "Bölgendeki fırsatları ilk sen gör", p: "İl ya da bölge seç; ihaleler, yatırımlar ve finansman haberleri sana göre süzülsün." },
    { t: "steel", h: "Protective boya hesabı cebinde", p: "Çelik tonajından yüzey alanını, katlardan boya miktarını ve maliyeti saniyeler içinde hesapla." }
  ];
  V.onboarding = p => {
    const k = p.k || 0, o = ONB[k];
    return '<div class="onb"><div class="art">' + NS.sceneSVG(o.t, "onb" + k) + '' + langPill("position:absolute;left:var(--gutter);top:calc(env(safe-area-inset-top) + 14px);z-index:3") + '<button class="skip" data-act="onbDone">Atla</button></div><div class="txt">' +
      '<div class="dots">' + ONB.map((_, j) => '<i class="' + (j === k ? "on" : "") + '"></i>').join("") + '</div><h1>' + o.h + '</h1><p class="lead" style="margin:0">' + o.p + '</p><span style="flex:1"></span>' +
      '<button class="btn" data-act="' + (k < ONB.length - 1 ? "onbNext" : "onbDone") + '">' + (k < ONB.length - 1 ? "Devam Et" : "Başlayalım") + '</button></div></div>';
  };

  // 3 · Giriş
  V.login = p => '<div class="auth"><div style="display:flex;align-items:center">' + (S.stack.length > 1 ? '<button class="iconbtn" data-back="1" aria-label="Geri">' + ic("left") + '</button>' : '') + '<span style="flex:1"></span>' + langPill() + '</div>' +
    '<div class="logo">' + MARK() + '<b>COAT<span style="color:var(--np-amber-400)">NEWS</span></b><small>Global Coatings Media</small></div><h1>Hesabına giriş yap</h1>' +
    '<form class="stack" data-form="login" novalidate><label class="field"><span class="sr">E-posta</span><span class="input">' + ic("mail") + '<input type="email" name="email" placeholder="E-posta" autocomplete="email" inputmode="email" required></span></label>' +
    '<label class="field"><span class="sr">Şifre</span><span class="input">' + ic("lock") + '<input type="password" name="password" placeholder="Şifre" autocomplete="current-password" required><button type="button" class="iconbtn" style="width:36px;height:36px" data-act="pwToggle" aria-label="Şifreyi göster">' + ic("eye", "ic sm") + '</button></span></label>' +
    '<div style="display:flex;justify-content:flex-end"><button type="button" class="btn ghost" style="width:auto" data-act="forgot">Şifremi unuttum</button></div>' +
    '<div class="err" id="ferr"></div><button class="btn" type="submit">Giriş Yap</button></form>' +
    '<div class="divider">veya</div><div class="stack"><button class="btn apple" data-act="apple">' + ic("apple") + 'Apple ile giriş yap</button><button class="btn secondary" data-act="guest">Misafir olarak devam et</button></div>' +
    '<p class="foot-note">Hesabın yok mu? <button data-go="signup">Kayıt ol</button></p></div>';

  // 4 · Kayıt
  V.signup = () => '<div class="auth"><button class="iconbtn" data-back="1" aria-label="Geri">' + ic("left") + '</button><h1 style="margin-top:12px">Kayıt ol</h1>' +
    '<form class="stack" data-form="signup" novalidate><label class="field"><span class="sr">Ad soyad</span><span class="input">' + ic("user") + '<input name="name" placeholder="Ad Soyad" autocomplete="name" required></span></label>' +
    '<label class="field"><span class="sr">E-posta</span><span class="input">' + ic("mail") + '<input type="email" name="email" placeholder="E-posta" autocomplete="email" inputmode="email" required></span></label>' +
    '<label class="field"><span class="sr">Şifre</span><span class="input">' + ic("lock") + '<input type="password" name="password" placeholder="Şifre (en az 8 karakter)" autocomplete="new-password" minlength="8" required><button type="button" class="iconbtn" style="width:36px;height:36px" data-act="pwToggle" aria-label="Şifreyi göster">' + ic("eye", "ic sm") + '</button></span></label>' +
    '<label class="check"><input type="checkbox" name="terms" required><span><button type="button" style="color:var(--np-blue-300);font-weight:600" data-go="legal">Kullanım koşulları ve gizlilik politikasını</button> okudum, kabul ediyorum.</span></label>' +
    '<div class="err" id="ferr"></div><button class="btn" type="submit">Kayıt Ol</button></form><p class="foot-note">Zaten hesabın var mı? <button data-back="1">Giriş yap</button></p></div>';

  // 5 · Ana sayfa
  V.home = () => {
    const pool = visible(), list = S.seg === "all" ? pool : S.seg === "star" ? pool.filter(i => i.star) : pool.filter(i => i._s === S.seg);
    const hero = list.slice().sort(byScore).slice(0, 4), rest = list.filter(i => !hero.includes(i)).sort(byDate);
    const anyNew = pool.some(i => i.isNew);
    let h = '<header class="navbar"><div class="navrow"><div class="brand">' + MARK() + '<div><b>COAT<span style="color:var(--np-amber-400)">NEWS</span></b><small>Global Coatings Media</small></div></div>' +
      '<button class="iconbtn fill" data-go="notifs" aria-label="Yeni haberler">' + ic("bell") + (anyNew ? '<span class="dot"></span>' : '') + '</button><button class="avatar" data-go="profile" aria-label="Profil">' + initials() + '</button></div>' + locBar() +
      '<div class="chips" role="group" aria-label="Filtre" style="margin-top:10px"><button class="chip" data-seg="all" aria-pressed="' + (S.seg === "all") + '">Tümü <span class="n">' + pool.length + '</span></button><button class="chip" data-seg="star" aria-pressed="' + (S.seg === "star") + '">★ Bölgem <span class="n">' + pool.filter(i => i.star).length + '</span></button>' +
      SEC_KEYS.map(k => { const n = pool.filter(i => i._s === k).length; return n ? '<button class="chip" data-seg="' + k + '" aria-pressed="' + (S.seg === k) + '">' + SECTORS[k].n + ' <span class="n">' + n + '</span></button>' : ""; }).join("") + '</div></header><main class="wrap">';
    if (!list.length) return h + empty("Bu filtrede haber yok", "Konumu ya da filtreyi değiştir.") + '</main>';
    h += '<section class="hero" aria-roledescription="carousel" aria-label="Öne çıkanlar"><div class="track" id="herotrack">' + hero.map(i => '<button class="slide" data-open="' + esc(i.id) + '">' + scene(i, "h") + '<div class="cap"><span>' + (i.star ? '<span class="tag" style="--c:#E06A00">★ Bölgem</span> ' : '') + tag(i) + '</span><h3>' + esc(i.company || i.title) + '</h3><p>' + esc(i.why || i.summary) + '</p></div></button>').join("") + '</div><div class="dots">' + hero.map((_, k) => '<i class="' + (k ? "" : "on") + '"></i>').join("") + '</div></section>';
    h += '<div class="quick"><button class="qa" data-tab="calc"><span class="qi" style="background:rgba(255,122,0,.16);color:var(--np-amber-400)">' + ic("roller") + '</span><span><b>Boya Hesapla</b><small>Protective sarfiyat</small></span></button><button class="qa" data-go="map"><span class="qi" style="background:rgba(77,184,255,.16);color:var(--np-blue-300)">' + ic("map") + '</span><span><b>Proje Haritası</b><small>' + pool.filter(i => i._c.length && i._c[0] !== GLOBAL).length + ' konumlu haber</small></span></button></div>';
    h += '<div class="h-sec"><h2>Güncel Fırsatlar</h2><button class="more" data-go="opps">Tümü ' + ic("chev", "ic xs") + '</button></div><div class="list">' + rest.slice(0, 6).map(ncard).join("") + '</div>';
    h += '<p class="foot">Son güncelleme: ' + esc(UPD) + ' · 50+ fırsat puanlı haberler</p></main>';
    return h;
  };

  // 6 · Güncel fırsatlar
  V.opps = p => {
    const pool = visible().filter(i => !p.sector || i._s === p.sector);
    const list = (S.kind === "all" ? pool : pool.filter(i => i.kind === S.kind)).sort(byDate);
    const title = p.sector ? SECTORS[p.sector].n : "Güncel Fırsatlar";
    const kinds = ["all", "tender", "investment", "finance", "deal"].filter(k => k === "all" || pool.some(i => i.kind === k));
    return nav(title, '<button class="iconbtn" data-go="search" aria-label="Ara">' + ic("search") + '</button>', { extra: '<div class="chips" style="margin-top:8px">' + kinds.map(k => '<button class="chip" data-kind="' + k + '" aria-pressed="' + (S.kind === k) + '">' + (k === "all" ? "Tümü" : KIND[k]) + ' <span class="n">' + (k === "all" ? pool.length : pool.filter(i => i.kind === k).length) + '</span></button>').join("") + '</div>' }) +
      '<main class="wrap"><div class="list">' + (list.length ? list.map(ncard).join("") : empty("Bu filtrede fırsat yok")) + '</div></main>';
  };

  // 7 · Sektörler
  V.sectors = () => {
    const pool = visible();
    return tabNav("Haberler", '<button class="iconbtn fill" data-go="search" aria-label="Ara">' + ic("search") + '</button>') + '<main class="wrap"><p class="lead" style="margin:0 0 14px">Tüm içerik beş ana segmentte toplanır.</p><div class="rows">' +
      SEC_KEYS.map(k => { const s = SECTORS[k], n = pool.filter(i => i._s === k); const top = n.slice().sort(byScore)[0]; return '<button class="row" data-sector="' + k + '"><span class="ri" style="background:color-mix(in srgb,' + s.c + ' 18%,transparent);color:' + s.c + '">' + ic(s.i) + '</span><span class="rt"><b>' + s.n + '</b><small>' + s.d + (top ? ' · en yüksek ★' + top.score : '') + '</small></span><span class="cnt">' + n.length + '</span>' + ic("chev", "ic sm chev") + '</button>'; }).join("") +
      '</div></main>';
  };

  // 8 · Projeler
  V.projects = () => {
    const pool = visible().filter(i => i._isProject);
    const run = pool.filter(i => !i._p), plan = pool.filter(i => i._p);
    const list = (S.proj === "run" ? run : S.proj === "plan" ? plan : pool).slice().sort(byScore);
    return tabNav("Projeler", '<button class="iconbtn fill" data-go="map" aria-label="Harita">' + ic("map") + '</button>', '<div class="seg" role="group" aria-label="Durum" style="margin-top:12px">' + [["all", "Tümü", pool.length], ["run", "Devam Eden", run.length], ["plan", "Planlanan", plan.length]].map(([k, l, n]) => '<button data-proj="' + k + '" aria-pressed="' + (S.proj === k) + '">' + l + '<span class="n">' + n + '</span></button>').join("") + '</div>') +
      '<main class="wrap"><div class="list">' + (list.length ? list.map(pcard).join("") : empty("Bu durumda proje yok")) + '</div></main>';
  };

  // 9 · Proje detayı
  V.project = p => {
    const i = get(p.id); if (!i) return nav("Proje") + empty("Proje bulunamadı");
    const t = p.t || "general";
    const heroNav = '<header class="navbar"><div class="navrow"><button class="iconbtn" data-back="1" aria-label="Geri">' + ic("left") + '</button><span class="sp"></span>' + bmBtn(i, "iconbtn") + '<button class="iconbtn" data-share="' + esc(i.id) + '" aria-label="Paylaş">' + ic("share") + '</button></div></header>';
    let h = '<div class="dhero">' + scene(i, "h") + heroNav + '<div class="cap"><span>' + tag(i) + ' <span class="tag soft" style="--c:' + (i._p ? "#FF7A00" : "#00C29E") + '">' + (i._p ? "Planlanan" : "Devam Ediyor") + '</span></span><h1 class="dtitle">' + esc(i.company || i.title) + '</h1><span class="score" style="font-size:18px">★ ' + i.score + '<span class="dim" style="font-size:13px;font-weight:600">/100 fırsat puanı</span></span></div></div><main class="wrap">';
    h += '<div class="seg" role="tablist" style="margin:6px 0 16px">' + [["general", "Genel"], ["detail", "Detay"], ["docs", "Doküman"]].map(([k, l]) => '<button role="tab" data-ptab="' + k + '" aria-pressed="' + (t === k) + '">' + l + '</button>').join("") + '</div>';
    if (t === "general") {
      h += '<div class="card facts">' + [["pin", "Konum", place(i)], ["clock", "Durum", i._p ? "Planlanan" : "Devam Ediyor"], ["calendar", i.deadline ? "Son teklif tarihi" : i.edate ? "Hedef tarih" : "Yayın tarihi", i.deadline || i.edate || fdate(i.date)], ["brief", "Tür", KIND[i.kind] || "Haber"], ["layers", "Boya segmenti", PAINT[i.seg] || "–"]].map(([ii, l, v]) => '<div class="fact"><span class="fi">' + ic(ii) + '</span><span><small>' + l + '</small><b>' + esc(v) + '</b></span></div>').join("") + '</div>';
      if (i.why) h += '<div class="why" style="margin-top:14px"><div class="h"><span>Neden fırsat</span><span>★ ' + i.score + '/100</span></div><p>' + esc(i.why) + '</p></div>';
    } else if (t === "detail") {
      h += '<h2 style="font-size:var(--fs-title3);margin:0 0 8px">' + esc(i.title) + '</h2><p class="body">' + esc(i.summary) + '</p><div class="card" style="margin-top:16px"><div class="meta">' + ic("doc", "ic xs") + '<span>' + esc(i.source) + '</span><span class="sep"></span><span>' + fdate(i.date) + '</span><span class="sep"></span><span>' + esc(i.lang || "") + '</span></div></div>';
    } else {
      h += '<div class="rows"><a class="src" href="' + esc(i.url) + '" target="_blank" rel="noopener">' + ic("doc") + '<span class="rt" style="flex:1"><b>' + esc(i.source) + '</b><small class="dim">Orijinal haber · ' + fdate(i.date) + '</small></span>' + ic("ext", "ic sm") + '</a>' +
        (i.also || []).map(a => '<a class="src" href="' + esc(a.url) + '" target="_blank" rel="noopener">' + ic("doc") + '<span class="rt" style="flex:1"><b>' + esc(a.source) + '</b><small class="dim">Diğer kaynak</small></span>' + ic("ext", "ic sm") + '</a>').join("") + '</div>';
    }
    h += '<a class="btn" style="margin-top:18px" href="' + esc(i.url) + '" target="_blank" rel="noopener">Orijinal haberi oku ' + ic("ext", "ic sm") + '</a></main>';
    return h;
  };

  // 10 · Haber detayı
  V.news = p => {
    const i = get(p.id); if (!i) return nav("Haber") + empty("Haber bulunamadı");
    const rel2 = DATA.filter(x => x.id !== i.id && x._s === i._s).sort(byScore).slice(0, 2);
    const heroNav = '<header class="navbar"><div class="navrow"><button class="iconbtn" data-back="1" aria-label="Geri">' + ic("left") + '</button><span class="sp"></span>' + bmBtn(i, "iconbtn") + '<button class="iconbtn" data-share="' + esc(i.id) + '" aria-label="Paylaş">' + ic("share") + '</button></div></header>';
    let h = '<div class="dhero">' + scene(i, "h") + heroNav + '<div class="cap"><span>' + tag(i) + (i.kind ? ' <span class="tag soft" style="--c:#9AD4FF">' + KIND[i.kind] + '</span>' : '') + '</span><h1 class="dtitle">' + esc(i.title) + '</h1><span class="meta">' + ic("calendar", "ic xs") + '<span>' + fdate(i.date) + '</span><span class="sep"></span>' + ic("clock", "ic xs") + '<span>' + readMin(i) + ' dk okuma</span><span class="sep"></span><span>' + esc(i.source) + '</span></span></div></div><main class="wrap">';
    h += '<p class="body">' + esc(i.summary) + '</p>';
    if (i.why) h += '<div class="why" style="margin-top:18px"><div class="h"><span>Neden fırsat</span><span>★ ' + i.score + '/100</span></div>' + (i.company ? '<p style="font-weight:700;margin-bottom:6px">' + esc(i.company) + '</p>' : '') + '<p>' + esc(i.why) + '</p></div>';
    h += '<div class="card facts" style="margin-top:14px">' + [["pin", "Konum", place(i)], ["layers", "Segment", SECTORS[i._s].n + " · " + (NS.TOPIC_LABEL[i._t] || "")], ["calendar", i.deadline ? "Son teklif tarihi" : "Yayın tarihi", i.deadline || fdate(i.date)]].map(([ii, l, v]) => '<div class="fact"><span class="fi">' + ic(ii) + '</span><span><small>' + l + '</small><b>' + esc(v) + '</b></span></div>').join("") + '</div>';
    if (rel2.length) h += '<div class="h-sec"><h2 style="font-size:var(--fs-title3)">İlgili haberler</h2></div><div class="related">' + rel2.map(x => '<button class="rel" data-open="' + esc(x.id) + '"><div class="thumb">' + scene(x) + '</div><b>' + esc(x.company || x.title) + '</b></button>').join("") + '</div>';
    h += '<a class="btn" style="margin-top:18px" href="' + esc(i.url) + '" target="_blank" rel="noopener">Orijinal haberi oku ' + ic("ext", "ic sm") + '</a></main>';
    return h;
  };

  // 11 · Konum seçimi
  V.location = p => {
    const d = p.draft || (p.draft = { sel: new Set(S.loc), open: REGIONS.find(([, cs]) => cs.some(c => S.loc.has(c)))?.[0] || null, q: "" });
    const all = DATA.filter(i => !S.hidden.includes(i._s)), cnt = {};
    all.forEach(i => i._c.forEach(c => (cnt[c] = (cnt[c] || 0) + 1)));
    const q = lc(d.q), n = all.filter(i => !d.sel.size || i._c.some(c => d.sel.has(c))).length;
    let h = nav("Konum", '<button class="iconbtn" data-act="locNone" aria-label="Temizle" style="width:auto;padding:0 6px;font-size:15px;color:var(--np-blue-300)">Temizle</button>', { large: true }) + '<main class="wrap" style="padding-bottom:90px">';
    h += '<label class="search">' + ic("search") + '<input type="search" placeholder="Konum ara…" value="' + esc(d.q) + '" data-locq="1" aria-label="Konum ara"></label>';
    h += '<div class="rows" style="margin-top:14px"><button class="row" data-act="locAll"><span class="ri">' + ic("pin") + '</span><span class="rt"><b>Tüm Türkiye ve Global</b><small>Konum filtresi yok</small></span><span class="cbox' + (d.sel.size ? "" : " on") + '"></span></button>' +
      '<button class="row" data-act="locMine"><span class="ri" style="color:var(--np-amber-400);background:rgba(255,122,0,.14)">' + ic("star") + '</span><span class="rt"><b>Bölgem</b><small>İstanbul + Trakya</small></span><span class="cbox' + (MINE.every(c => d.sel.has(c)) ? " on" : MINE.some(c => d.sel.has(c)) ? " part" : "") + '"></span></button>' +
      '<button class="row" data-locc="' + GLOBAL + '"><span class="ri">' + ic("globe") + '</span><span class="rt"><b>Global</b><small>Yurt dışı projeler</small></span><span class="cnt">' + (cnt[GLOBAL] || 0) + '</span><span class="cbox' + (d.sel.has(GLOBAL) ? " on" : "") + '"></span></button></div>';
    h += '<div class="h-sec" style="margin-top:20px"><h2 style="font-size:var(--fs-headline)">Bölgeler</h2></div><div class="rows">';
    for (const [r, cs] of REGIONS) {
      const list = q ? cs.filter(c => lc(c).includes(q)) : cs; if (!list.length) continue;
      const rc = cs.reduce((s, c) => s + (cnt[c] || 0), 0), selN = cs.filter(c => d.sel.has(c)).length, open = q || d.open === r;
      h += '<div><div class="row" style="padding-right:8px"><button class="cbox' + (selN === cs.length ? " on" : selN ? " part" : "") + '" data-locr="' + r + '" aria-label="' + r + ' bölgesinin tümü" style="margin:0 7px"></button><button class="rt" data-loco="' + r + '" style="text-align:left;display:flex;align-items:center;gap:8px;min-height:44px"><span style="flex:1"><b>' + r + '</b><small>' + rc + ' haber' + (selN ? ' · ' + selN + ' il seçili' : '') + '</small></span>' + ic(open ? "down" : "chev", "ic sm chev") + '</button></div>';
      if (open) h += '<div class="cities">' + list.slice().sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0) || a.localeCompare(b, "tr")).map(c => '<button class="city' + (d.sel.has(c) ? " on" : "") + (cnt[c] ? "" : " zero") + '" data-locc="' + c + '">' + c + (cnt[c] ? '<span>' + cnt[c] + '</span>' : '') + '</button>').join("") + '</div>';
      h += '</div>';
    }
    h += '</div></main><div class="stickybar"><div class="in"><button class="btn" data-act="locApply">Uygula · ' + n + ' haber</button></div></div>';
    return h;
  };

  // 12 · Proje haritası
  const PX = (lon, lat) => [(lon - 25.6) * 20.5, (42.4 - lat) * 29];
  const poly = a => a.map(([lo, la]) => PX(lo, la).map(v => v.toFixed(1)).join(",")).join(" ");
  const THRACE = [[26.35, 41.75], [26.6, 41.98], [27.5, 42.0], [28.05, 41.95], [28.6, 41.4], [29.05, 41.25], [28.9, 41.02], [28.0, 40.98], [27.5, 40.97], [26.9, 40.55], [26.2, 40.05], [26.4, 40.5], [26.05, 40.75], [26.35, 41.2], [26.6, 41.6]];
  const ANAT = [[29.1, 41.2], [29.6, 41.18], [30.5, 41.15], [31.8, 41.45], [33.3, 42.0], [35.1, 42.03], [36.3, 41.3], [37.9, 41.05], [39.7, 41.0], [41.5, 41.45], [42.5, 41.55], [43.4, 41.2], [43.6, 40.6], [44.8, 39.7], [44.3, 38.4], [44.7, 37.2], [43.0, 37.3], [41.2, 37.1], [38.0, 36.8], [37.0, 36.7], [36.6, 36.2], [35.9, 35.85], [35.8, 36.3], [36.1, 36.65], [35.0, 36.6], [34.6, 36.8], [33.9, 36.3], [32.8, 36.05], [32.0, 36.5], [30.7, 36.85], [29.6, 36.2], [29.1, 36.6], [28.2, 36.7], [27.4, 37.0], [27.2, 37.8], [26.3, 38.3], [26.8, 38.7], [26.7, 39.3], [26.2, 39.6], [26.3, 40.0], [27.0, 40.4], [28.0, 40.4], [29.0, 40.4], [29.9, 40.75], [29.2, 40.9]];
  V.map = p => {
    const pool = visible(), byCity = {};
    pool.forEach(i => i._c.forEach(c => { if (COORD[c]) (byCity[c] = byCity[c] || []).push(i); }));
    const sel = p.city, zm = p.zoom === "mm", k = zm ? 3.2 : 1;
    const globalN = pool.filter(i => i._c[0] === GLOBAL).length;
    const vb = zm ? "6 4 112 72" : "-6 -10 412 214";
    let svg = '<svg viewBox="' + vb + '" role="img" aria-label="' + (zm ? "Marmara" : "Türkiye") + ' proje haritası"><defs><pattern id="mdot" width="' + 5 / k + '" height="' + 5 / k + '" patternUnits="userSpaceOnUse"><circle cx="' + 2.5 / k + '" cy="' + 2.5 / k + '" r="' + 1 / k + '" fill="#2E7FD0"/></pattern><radialGradient id="mglow"><stop offset="0" stop-color="#4DB8FF" stop-opacity=".55"/><stop offset="1" stop-color="#4DB8FF" stop-opacity="0"/></radialGradient></defs>' +
      '<polygon points="' + poly(ANAT) + '" fill="url(#mdot)" stroke="#2F78C8" stroke-width="' + 1 / k + '"/><polygon points="' + poly(THRACE) + '" fill="url(#mdot)" stroke="#2F78C8" stroke-width="' + 1 / k + '"/>';
    Object.entries(byCity).sort((a, b) => a[1].length - b[1].length).forEach(([c, l]) => {
      const [x, y] = PX(COORD[c][1], COORD[c][0]), r = (6 + Math.min(8, l.length * 1.2)) / k, on = sel === c, mine = MINE.includes(c);
      svg += '<g class="bub" data-city="' + c + '" role="button" tabindex="0" aria-label="' + c + ', ' + l.length + ' haber"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r + 7 / k) + '" fill="url(#mglow)"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + (mine ? "#FF7A00" : "#0066FF") + '" stroke="' + (on ? "#fff" : "rgba(255,255,255,.6)") + '" stroke-width="' + (on ? 2.5 : 1.2) / k + '"/><text x="' + x.toFixed(1) + '" y="' + (y + 3.6 / k).toFixed(2) + '" text-anchor="middle" style="font-size:' + (11 / k).toFixed(2) + 'px">' + l.length + '</text>' + (zm ? '<text x="' + x.toFixed(1) + '" y="' + (y + r + 4.2).toFixed(1) + '" text-anchor="middle" class="lbl" style="font-size:3.2px">' + c + '</text>' : '') + '</g>';
    });
    svg += '</svg>';
    const ranked = Object.entries(byCity).sort((a, b) => b[1].length - a[1].length);
    let below;
    if (sel) below = '<div class="h-sec"><h2 style="font-size:var(--fs-title3)">' + esc(sel) + ' · ' + (byCity[sel] || []).length + ' haber</h2><button class="more" data-act="mapReset">Kapat ' + ic("x", "ic xs") + '</button></div><div class="list">' + (byCity[sel] || []).slice().sort(byScore).map(pcard).join("") + '</div>';
    else below = '<div class="h-sec"><h2 style="font-size:var(--fs-title3)">En çok haber olan iller</h2></div><div class="rows">' + ranked.slice(0, 8).map(([c, l]) => '<button class="row" data-city="' + c + '"><span class="ri">' + ic("pin") + '</span><span class="rt"><b>' + c + '</b><small>' + CITY_REGION[c] + ' · en yüksek ★' + Math.max(...l.map(i => i.score)) + '</small></span><span class="cnt">' + l.length + '</span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>';
    return nav("Proje Haritası", '<button class="iconbtn" data-go="location" aria-label="Konum filtresi">' + ic("filter") + '</button>', { large: true }) + '<main class="wrap">' +
      '<div class="seg" style="margin-bottom:12px"><button data-act="mapTr" aria-pressed="' + !zm + '">Türkiye</button><button data-act="mapMm" aria-pressed="' + zm + '">Marmara</button></div>' +
      '<div class="mapbox' + (zm ? " zm" : "") + '">' + svg + '</div>' +
      '<div class="legend"><span><i style="background:#0066FF"></i>Haber sayısı</span><span><i style="background:#FF7A00"></i>Bölgem</span><span>' + ic("globe", "ic xs") + ' Global: ' + globalN + '</span></div>' + below + '</main>';
  };

  // Arama
  V.search = () => nav("Arama") + '<main class="wrap"><label class="search">' + ic("search") + '<input id="q" type="search" placeholder="Şirket, şehir veya konu ara" value="' + esc(S.q) + '" data-q="1" aria-label="Ara"></label><div class="list" id="res" style="margin-top:14px"></div></main>';
  function doSearch() {
    const q = lc(S.q), el = $("res"); if (!el) return;
    if (!q) { el.innerHTML = '<p class="lead">Örnek: demiryolu, Tekirdağ, rüzgar, ihale</p>'; return; }
    const r = DATA.filter(i => lc(i.title + " " + i.company + " " + i.summary + " " + i.source + " " + i._c.join(" ") + " " + SECTORS[i._s].n + " " + (NS.TOPIC_LABEL[i._t] || "")).includes(q)).sort(byScore);
    el.innerHTML = r.length ? r.map(ncard).join("") : empty("Sonuç yok", "Başka bir kelime dene.");
  }

  // Yeni haberler (zil)
  V.notifs = () => { const l = visible().filter(i => i.isNew).sort(byDate), l2 = l.length ? l : visible().sort(byDate).slice(0, 8); return nav(l.length ? "Yeni Haberler" : "Son Haberler") + '<main class="wrap">' + (l.length ? "" : '<p class="lead" style="margin:0 0 12px">Son 48 saatte yeni haber yok. En son eklenenler:</p>') + '<div class="list">' + l2.map(ncard).join("") + '</div></main>'; };

  /* ---------- 13–16 · Protective hesaplama ----------
     Teorik yayılma (m²/L) = hacimce katı madde (%) × 10 ÷ DFT (µm)
     Pratik yayılma = teorik × (1 − fire %) · Yaş film (µm) = DFT × 100 ÷ katı madde · Maliyet/m² = $/L ÷ pratik yayılma */
  const STEEL = [["Ağır profil", "HEB, HEM, kalın sac", 12], ["Orta profil", "IPE, HEA", 20], ["Hafif profil", "Köşebent, U, boru", 35], ["İnce sac", "Kafes, ince levha", 50]];
  const L3 = (n, dft, vs, coats = 1) => ({ n, dft, vs, coats, price: "" });
  let C = store.get("calc", null);
  if (!C || !Array.isArray(C.layers)) C = { mode: "ton", ton: 100, m2t: 20, area: 1000, loss: 30, layers: [L3("Astar", 60, 58), L3("Ara kat", 120, 75), L3("Son kat", 60, 55)] };
  const saveC = () => store.set("calc", C);
  const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const f = (n, d = 1) => (isFinite(n) ? n : 0).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const usd = (n, d = 0) => "$" + f(n, d);
  const wftOf = l => { const d = num(l.dft), v = num(l.vs); return d > 0 && v > 0 ? Math.round(d * 100 / v) : ""; };
  const areaOf = (c = C) => c.mode === "ton" ? num(c.ton) * num(c.m2t) : num(c.area);
  function calc(c = C) {
    const A = areaOf(c), L = Math.min(Math.max(num(c.loss), 0), 90) / 100;
    const rows = c.layers.map(l => {
      const dft = num(l.dft), vs = num(l.vs), coats = Math.max(1, Math.round(num(l.coats)) || 1), price = num(l.price);
      const theo = vs > 0 && dft > 0 ? (vs * 10) / dft : 0, prac = theo * (1 - L), liters = prac > 0 ? (A * coats) / prac : 0;
      return { n: l.n, dft, vs, coats, theo, prac, liters, price, wft: wftOf(l), cost: liters * price, cpm: price > 0 && prac > 0 ? (price * coats) / prac : 0, tot: dft * coats };
    });
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    return { A, L, rows, liters: sum("liters"), cost: sum("cost"), cpm: sum("cpm"), dft: sum("tot") };
  }
  const stepsBar = n => '<div class="steps" role="list">' + [["calcSurface", "Yüzey Bilgisi"], ["calcSystem", "Sistem"], ["calcResult", "Sonuç"]].map(([k, l], j) => '<button role="listitem" data-step="' + k + '"' + (j === n ? ' aria-current="step"' : '') + ' class="' + (j < n ? "done" : "") + '"><i>' + (j < n ? "✓" : j + 1) + '</i>' + l + '</button>').join("") + '</div>';
  const fin = (k, label, val, unit, attrs = "", cls = "") => '<label class="field"><span class="lbl">' + label + '</span><span class="input ' + cls + '"><input inputmode="decimal" ' + attrs + ' value="' + esc(String(val ?? "")) + '" placeholder="0"><span class="unit">' + unit + '</span></span></label>';

  V.calc = () => tabNav("Boya Hesapla") + '<main class="wrap"><div class="intro-art">' + '<svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="ia"><stop offset="0" stop-color="#0066FF" stop-opacity=".45"/><stop offset="1" stop-color="#0066FF" stop-opacity="0"/></radialGradient><linearGradient id="ib" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9AD4FF"/><stop offset="1" stop-color="#0066FF"/></linearGradient></defs><circle cx="100" cy="100" r="96" fill="url(#ia)"/><g transform="rotate(-30 100 100)"><rect x="40" y="56" width="110" height="38" rx="12" fill="url(#ib)"/><rect x="40" y="56" width="110" height="10" rx="5" fill="#fff" opacity=".35"/><path d="M150 75h14v34H96v26" stroke="#C9D4E3" stroke-width="7" fill="none" stroke-linejoin="round"/><rect x="88" y="132" width="16" height="44" rx="5" fill="#FF7A00"/></g></svg></div>' +
    '<h1 style="font-size:var(--fs-title1);margin:0;font-weight:800">Protective Boya Hesapla</h1><p class="lead">Çelik tonajı ya da yüzey alanı, fire oranı ve boya katlarının bilgileriyle sarfiyatı ve maliyeti hesapla.</p>' +
    '<div class="feat">' + ["Tonajdan yüzey alanı (m²)", "Kat bazında sarfiyat (L)", "Kuru ve yaş film kalınlığı", "Toplam boya miktarı ve maliyet ($)"].map(t => '<div><span>' + ic("check", "ic xs") + '</span>' + t + '</div>').join("") + '</div>' +
    '<button class="btn" data-go="calcSurface">Hesaplamaya Başla</button>' + (S.calcs.length ? '<button class="btn ghost" style="margin-top:6px" data-act="savedCalcs">Kayıtlı hesaplar (' + S.calcs.length + ')</button>' : '') + '</main>';

  V.calcSurface = () => {
    const ton = C.mode === "ton";
    let h = nav("Boya Hesapla") + '<main class="wrap">' + stepsBar(0) + '<div class="stack" style="margin-top:18px">';
    h += '<div class="field"><span class="lbl">Yüzey bilgisini nasıl gireceksin?</span><div class="seg"><button data-cmode="ton" aria-pressed="' + ton + '">Çelik tonajı</button><button data-cmode="area" aria-pressed="' + !ton + '">Yüzey alanı</button></div></div>';
    if (ton) {
      h += fin("ton", "Çelik miktarı", C.ton, "ton", 'data-cf="ton"', "big");
      h += '<div class="field"><span class="lbl">Profil tipi</span><div class="opts">' + STEEL.map(([l, s, v]) => '<button class="opt" data-m2t="' + v + '" aria-pressed="' + (num(C.m2t) === v) + '"><b>' + l + '</b><small>' + s + '</small><em>' + v + ' m²/ton</em></button>').join("") + '</div></div>';
      h += fin("m2t", "Ton başına yüzey (elle değiştirilebilir)", C.m2t, "m²/ton", 'data-cf="m2t"');
      h += '<div class="calcout"><span><small>Hesaplanan yüzey alanı</small><b id="carea">' + f(areaOf(), 0) + ' m²</b></span>' + ic("swap", "ic lg") + '</div>';
    } else h += fin("area", "Boyanacak yüzey alanı", C.area, "m²", 'data-cf="area"', "big");
    h += '<div class="field"><span class="lbl">Fire oranı (toplam kayıp)</span><span class="input"><input inputmode="decimal" data-cf="loss" value="' + esc(String(C.loss ?? "")) + '" placeholder="30"><span class="unit">%</span></span><div class="pills" style="margin-top:4px">' + [20, 30, 40, 50].map(v => '<button data-loss="' + v + '" aria-pressed="' + (num(C.loss) === v) + '">%' + v + '</button>').join("") + '</div><span class="hint">Toplam boya kaybı: yüzey pürüzlülüğü, profil şekli ve uygulama koşullarına göre değişir.</span></div>';
    h += '<button class="btn" style="margin-top:8px" data-go="calcSystem">Devam Et</button></div></main>';
    return h;
  };

  V.calcSystem = () => {
    let h = nav("Boya Hesapla") + '<main class="wrap">' + stepsBar(1) + '<p class="lead" style="margin:14px 0">Her boya katı için teknik föydeki değerleri gir. Kuru filmi ya da yaş filmi yaz, diğeri otomatik hesaplanır.</p><div class="stack">';
    h += C.layers.map((l, i) => '<section class="layer"><div class="lhead"><span class="lnum">' + (i + 1) + '</span><input class="lname" data-cl="' + i + '.n" value="' + esc(l.n) + '" aria-label="Kat adı"><button class="iconbtn" style="width:36px;height:36px;color:var(--np-grey-500)" data-cdel="' + i + '" aria-label="Katı sil">' + ic("trash", "ic sm") + '</button></div><div class="stack">' +
      '<div class="grid2">' + fin("vs", "Hacimce katı madde", l.vs, "%", 'data-cl="' + i + '.vs"') + fin("coats", "Kat sayısı", l.coats, "kat", 'data-cl="' + i + '.coats"') + '</div>' +
      '<div class="film">' + fin("dft", "Kuru film (DFT)", l.dft, "µm", 'data-cl="' + i + '.dft"') + '<span class="lnk" aria-hidden="true">' + ic("swap", "ic sm") + '</span>' + fin("wft", "Yaş film (WFT)", wftOf(l), "µm", 'data-cl="' + i + '.wft"') + '</div>' +
      fin("price", "Birim fiyat (isteğe bağlı)", l.price, "$/L", 'data-cl="' + i + '.price"') + '</div></section>').join("");
    h += '<button class="addl" data-act="addLayer">' + ic("plus", "ic sm") + 'Kat ekle</button><button class="btn" data-go="calcResult">Hesapla</button></div></main>';
    return h;
  };

  V.calcResult = p => {
    const c = p.calc || C, r = calc(c);
    let h = nav("Boya Hesapla") + '<main class="wrap">' + (p.calc ? '' : stepsBar(2)) + '<section class="result" style="margin-top:16px"><div class="ok"><span>' + ic("check", "ic sm") + '</span>Hesaplama sonucu</div>' +
      '<div class="kpi"><small>Toplam boya miktarı</small><b>' + f(r.liters, 0) + ' L</b></div>' + (r.cost ? '<div class="kpi"><small>Yaklaşık maliyet</small><b style="font-size:30px">' + usd(r.cost) + '</b></div>' : '') +
      '<div class="kpis"><div><small>Yüzey alanı</small><b>' + f(r.A, 0) + ' m²</b></div><div><small>Toplam DFT</small><b>' + f(r.dft, 0) + ' µm</b></div><div><small>' + (r.cpm ? "m² maliyeti" : "Fire") + '</small><b>' + (r.cpm ? usd(r.cpm, 2) : "%" + f(r.L * 100, 0)) + '</b></div></div></section>';
    h += '<div class="h-sec"><h2 style="font-size:var(--fs-title3)">Kat bazında sarfiyat</h2></div><div class="card lres">' + r.rows.map((x, i) => '<div class="lr"><div class="t"><span>' + (i + 1) + '. ' + esc(x.n || "Kat") + '</span><b>' + f(x.liters, 1) + ' L</b></div><div class="d"><span>' + x.coats + ' × ' + f(x.dft, 0) + ' µm DFT</span><span>WFT ' + (x.wft || "–") + ' µm</span><span>KM %' + f(x.vs, 0) + '</span><span>Pratik ' + f(x.prac, 2) + ' m²/L</span>' + (x.cost ? '<span>' + usd(x.cost) + '</span>' : '') + '</div></div>').join("") + '</div>';
    h += '<div class="card" style="margin-top:12px"><div class="meta" style="gap:6px 14px">' + (c.mode === "ton" ? '<span>Çelik: <b style="color:#fff">' + f(num(c.ton), 0) + ' t × ' + f(num(c.m2t), 0) + ' m²/t</b></span>' : '') + '<span>Fire: <b style="color:#fff">%' + f(r.L * 100, 0) + '</b></span><span>Sarfiyat: <b style="color:#fff">' + f(r.A ? r.liters / r.A : 0, 3) + ' L/m²</b></span></div></div>';
    h += '<div class="btnrow" style="margin-top:18px"><button class="btn secondary" data-act="shareCalc">' + ic("share", "ic sm") + 'Paylaş</button>' + (p.calc ? '<button class="btn" data-act="loadCalc">' + ic("edit", "ic sm") + 'Düzenle</button>' : '<button class="btn" data-act="saveCalc">' + ic("bm", "ic sm") + 'Kaydet</button>') + '</div>';
    h += '<p class="formula">Teorik yayılma = katı madde × 10 ÷ DFT · Pratik yayılma = teorik × (1 − fire) · WFT = DFT × 100 ÷ katı madde. Ton başına yüzey profil boyutuna göre değişir; kesin alan için proje metrajını esas al.</p></main>';
    return h;
  };
  function calcText(c = C) {
    const r = calc(c);
    return "COATNEWS · Protective boya hesabı\n" + (c.mode === "ton" ? "Çelik: " + f(num(c.ton), 0) + " ton × " + f(num(c.m2t), 0) + " m²/t = " : "Alan: ") + f(r.A, 0) + " m² · Fire: %" + f(r.L * 100, 0) + "\n" +
      r.rows.map((x, i) => (i + 1) + ". " + (x.n || "Kat") + ": " + x.coats + " × " + f(x.dft, 0) + " µm DFT (WFT " + (x.wft || "–") + " µm, KM %" + f(x.vs, 0) + ") → " + f(x.liters, 0) + " L" + (x.cost ? ", " + usd(x.cost) : "")).join("\n") +
      "\nToplam: " + f(r.liters, 0) + " L · toplam DFT " + f(r.dft, 0) + " µm" + (r.cost ? "\nMaliyet: " + usd(r.cost) + " (" + usd(r.cpm, 2) + "/m²)" : "");
  }

  // 17 · Kayıtlılar
  V.saved = () => {
    const items = S.saved.map(get).filter(Boolean), opps = items.filter(i => !i._isProject), projs = items.filter(i => i._isProject), t = S.savedTab;
    let h = tabNav("Kayıtlılar", '', '<div class="seg" style="margin-top:12px">' + [["opps", "Fırsatlar", opps.length], ["projs", "Projeler", projs.length], ["calcs", "Hesaplamalar", S.calcs.length]].map(([k, l, n]) => '<button data-stab="' + k + '" aria-pressed="' + (t === k) + '">' + l + '<span class="n">' + n + '</span></button>').join("") + '</div>') + '<main class="wrap"><div class="list">';
    if (t === "calcs") h += S.calcs.length ? S.calcs.map((c, k) => { const r = calc(c.c); return '<div class="ccalc"><span class="qi">' + ic("roller") + '</span><button style="flex:1;text-align:left;min-width:0" data-act="openCalc" data-k="' + k + '"><b style="display:block;font-size:15px">' + esc(c.name) + '</b><span class="meta" style="margin-top:3px"><span>' + f(r.liters, 0) + ' L</span><span class="sep"></span><span>' + f(r.A, 0) + ' m²</span>' + (r.cost ? '<span class="sep"></span><span>' + usd(r.cost) + '</span>' : '') + '<span class="sep"></span><span>' + esc(c.d) + '</span></span></button><button class="iconbtn" style="width:36px;height:36px;color:var(--np-grey-500)" data-act="delCalc" data-k="' + k + '" aria-label="Sil">' + ic("trash", "ic sm") + '</button></div>'; }).join("") : empty("Kayıtlı hesap yok", "Hesap sonucunda Kaydet'e dokun.", "calc");
    else { const l = t === "projs" ? projs : opps; h += l.length ? l.map(t === "projs" ? pcard : ncard).join("") : empty("Henüz kayıt yok", "Kartlardaki yer imine dokunarak buraya ekleyebilirsin.", "bm"); }
    return h + '</div></main>';
  };

  // Daha fazla
  V.more = () => tabNav("Daha Fazla") + '<main class="wrap"><button class="phead" data-go="profile" style="width:100%"><span class="avatar">' + initials() + '</span><b>' + esc(displayName()) + '</b><small>' + esc(S.user ? S.user.email || "" : "Profil ve hesap") + '</small></button><div class="rows">' +
    [["bm", "Kayıtlılar", S.saved.length + " haber · " + S.calcs.length + " hesap", "goSaved"], ["map", "Proje Haritası", "Türkiye ve Marmara", "goMap"], ["gear", "Uygulama ayarları", "Segmentler ve konum", "goSettings"], ["bell", "Bildirim tercihleri", "Bölge fırsatları, ihaleler", "notifPrefs"], ["globe", "Dil · Language", window.NPLang && NPLang.get() === "en" ? "English" : "Türkçe", "lang"], ["help", "Yardım ve destek", "Sık sorulanlar, iletişim", "goHelp"], ["info", "Hakkında", "Sürüm " + VERSION + ", gizlilik", "goAbout"]].map(([i, t, s2, a]) => '<button class="row" data-act="' + a + '"><span class="ri">' + ic(i) + '</span><span class="rt"><b>' + t + '</b><small>' + s2 + '</small></span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div></main>';

  // 18 · Profil ve ayarlar
  V.profile = () => {
    const signed = !!S.user;
    return nav("Profil") + '<main class="wrap"><div class="phead"><span class="avatar">' + initials() + '</span><b>' + esc(displayName()) + '</b><small>' + esc(signed ? S.user.email || "" : "Hesabınla giriş yaparak kayıtlarını sakla") + '</small></div>' +
      '<div class="rows">' + [["user", "Profil bilgileri", signed ? "Ad ve e-posta" : "Giriş yap veya kayıt ol", signed ? "editProfile" : "goLogin"], ["bell", "Bildirim tercihleri", "Bölge fırsatları, ihaleler", "notifPrefs"], ["gear", "Uygulama ayarları", "İlgi alanları ve konum", "goSettings"], ["help", "Yardım ve destek", "Sık sorulanlar, iletişim", "goHelp"], ["globe", "Dil · Language", window.NPLang && NPLang.get() === "en" ? "English" : "Türkçe", "lang"], ["info", "Hakkında", "Sürüm " + VERSION + ", gizlilik", "goAbout"]].map(([i, t, s, a]) => '<button class="row" data-act="' + a + '"><span class="ri">' + ic(i) + '</span><span class="rt"><b>' + t + '</b><small>' + s + '</small></span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>' +
      '<button class="btn ' + (signed ? "danger" : "") + '" style="margin-top:20px" data-act="' + (signed ? "logout" : "goLogin") + '">' + ic(signed ? "logout" : "user", "ic sm") + (signed ? "Çıkış yap" : "Giriş yap") + '</button></main>';
  };
  V.settings = () => nav("Uygulama Ayarları") + '<main class="wrap"><div class="h-sec" style="margin-top:4px"><h2 style="font-size:var(--fs-headline)">İlgi alanların</h2></div><p class="lead" style="margin:-6px 0 12px">Kapattığın sektörler akışta görünmez.</p><div class="rows">' +
    SEC_KEYS.map(k => '<label class="row"><span class="ri" style="background:color-mix(in srgb,' + SECTORS[k].c + ' 18%,transparent);color:' + SECTORS[k].c + '">' + ic(SECTORS[k].i) + '</span><span class="rt"><b>' + SECTORS[k].n + '</b><small>' + SECTORS[k].d + '</small></span><input type="checkbox" class="switch" data-hide="' + k + '"' + (S.hidden.includes(k) ? "" : " checked") + ' aria-label="' + SECTORS[k].n + '"></label>').join("") + '</div>' +
    '<div class="h-sec"><h2 style="font-size:var(--fs-headline)">Konum</h2></div>' + locBar() + '</main>';
  V.help = () => nav("Yardım ve Destek") + '<main class="wrap prose"><h3>Haberler nereden geliyor?</h3><p>COATNEWS, sektör yayınlarını ve kamu ihale duyurularını her 6 saatte bir tarar; boya ve kaplama ihtiyacı doğurabilecek projeleri 0–100 arası fırsat puanıyla listeler. 50 puanın altındakiler gösterilmez.</p><h3>Konum filtresi nasıl çalışır?</h3><p>Haber metnindeki il, ilçe ve kurum adlarından konum bulunur (ör. Çorlu → Tekirdağ). Bölge ya da il seçerek akışı daraltabilirsin.</p><h3>Boya hesabı ne kadar kesin?</h3><p>Hesap; teknik föydeki hacimce katı madde ve film kalınlığıyla standart formülü kullanır. Ton başına yüzey değerleri tipiktir, kesin sonuç için proje metrajını kullan.</p></main>';
  V.about = () => nav("Hakkında") + '<main class="wrap"><div class="phead">' + MARK() .replace('class="mark"', 'class="mark" style="width:80px;height:80px"') + '<b>COAT<span style="color:var(--np-amber-400)">NEWS</span></b><small>Sürüm ' + VERSION + ' · Global Coatings Media</small></div><div class="rows"><button class="row" data-go="legal"><span class="ri">' + ic("shield") + '</span><span class="rt"><b>Gizlilik politikası ve kullanım koşulları</b></span>' + ic("chev", "ic sm chev") + '</button></div><p class="foot">Veri: kamuya açık haber ve ihale kaynakları. Haber içerikleri ilgili yayıncılara aittir.<br>Son veri güncellemesi: ' + esc(UPD) + '</p></main>';
  V.legal = () => nav("Gizlilik ve Koşullar") + '<main class="wrap prose"><h3>Gizlilik politikası</h3><p>COATNEWS reklam veya takip amaçlı veri toplamaz. Kayıtlı haberlerin, hesapların, konum ve ilgi alanı tercihlerin yalnızca cihazında saklanır. Hesap açarsan adın ve e-posta adresin, kimlik doğrulama için güvenli bir sunucuda (Supabase) tutulur ve üçüncü taraflarla paylaşılmaz.</p><p>Hesabını ve verilerini silmek için destek adresine yazabilirsin; talebin 30 gün içinde yerine getirilir.</p><h3>Kullanım koşulları</h3><p>Haber özetleri bilgilendirme amaçlıdır; asıl içerik ilgili yayıncıya aittir ve bağlantıyla kaynağa yönlendirilir. Boya hesapları tahmini değerlerdir; uygulama öncesi ürün teknik föyü ve proje spesifikasyonu esas alınmalıdır.</p></main>';

  /* ---------- Alt sayfa (sheet) ---------- */
  function sheet(html) {
    const el = $("sheet"); el.innerHTML = '<div class="bg" data-act="sheetClose"></div><div class="pn" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>'; el.hidden = false;
    requestAnimationFrame(() => el.classList.add("show")); document.body.style.overflow = "hidden";
  }
  function closeSheet() { const el = $("sheet"); el.classList.remove("show"); document.body.style.overflow = ""; setTimeout(() => { el.hidden = true; el.innerHTML = ""; }, 240); }

  /* ---------- Kimlik doğrulama (Supabase Auth, REST) ---------- */
  async function auth(path, body) {
    const r = await fetch(SUPA_URL + "/auth/v1/" + path, { method: "POST", headers: { apikey: SUPA_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.msg || j.error_description || j.message || "İşlem tamamlanamadı");
    return j;
  }
  const AUTH_ERR = m => /invalid login|invalid_credentials/i.test(m) ? "E-posta ya da şifre hatalı." : /already registered|already exists/i.test(m) ? "Bu e-posta ile zaten bir hesap var." : /password/i.test(m) ? "Şifre en az 8 karakter olmalı." : /network|fetch/i.test(m) ? "Bağlantı kurulamadı. İnternetini kontrol et." : m;
  function setUser(u, session) { S.user = u; S.session = session || null; store.set("user", u); store.set("session", S.session); }

  /* =========================================================
     ÇİZİM
     ========================================================= */
  function render(dir) {
    const c = cur(), name = c.name;
    const el = $("screen");
    el.className = "screen " + (dir === "back" ? "enter-back" : dir === "fwd" ? "enter" : "") + (NO_TAB.includes(name) ? " notab" : "");
    el.innerHTML = (V[name] || V.home)(c.p);
    const tb = $("tabbar");
    if (NO_TAB.includes(name)) tb.hidden = true;
    else {
      tb.hidden = false; const t = TAB_OF[name] || "home";
      tb.innerHTML = '<div class="in">' + [["home", "Ana Sayfa", "home"], ["sectors", "Haberler", "news"], ["projects", "Projeler", "brief"], ["calc", "Hesapla", "calc"], ["more", "Daha Fazla", "more"]].map(([k, l, i]) => '<button class="tab" data-tab="' + k + '"' + (t === k ? ' aria-current="page"' : '') + '>' + ic(i) + l + '</button>').join("") + '</div>';
    }
    if (name === "search") { doSearch(); const q = $("q"); if (q && !q.value) setTimeout(() => q.focus(), 50); }
    if (name === "home") heroDots();
  }
  function heroDots() {
    const tr = $("herotrack"); if (!tr) return;
    tr.addEventListener("scroll", () => { const k = Math.round(tr.scrollLeft / tr.clientWidth); document.querySelectorAll(".hero .dots i").forEach((d, j) => d.classList.toggle("on", j === k)); }, { passive: true });
  }
  function refreshCalc() {
    const a = $("carea"); if (a) a.textContent = f(areaOf(), 0) + " m²";
  }

  /* =========================================================
     OLAYLAR
     ========================================================= */
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-tab],[data-go],[data-back],[data-open],[data-save],[data-share],[data-seg],[data-kind],[data-proj],[data-sector],[data-ptab],[data-stab],[data-act],[data-locc],[data-locr],[data-loco],[data-city],[data-cmode],[data-m2t],[data-loss],[data-cdel],[data-step]");
    if (!t) return;
    const d = t.dataset;
    if (t.tagName === "A") return;
    if (d.save) { e.preventDefault(); e.stopPropagation(); toggleSave(d.save); document.querySelectorAll('[data-save="' + CSS.escape(d.save) + '"]').forEach(b => b.setAttribute("aria-pressed", String(isSaved(d.save)))); if (cur().name === "saved") render(); return; }
    cur().y = window.scrollY;
    if (d.tab) return tab(d.tab);
    if (d.back) return back();
    if (d.go) { if (d.go === "calcResult" || d.go === "calcSystem") saveC(); return go(d.go); }
    if (d.open) { const i = get(d.open); return go(i && i._isProject ? "project" : "news", { id: d.open }); }
    if (d.share) { const i = get(d.share); return share(i.company || i.title, i.url); }
    if (d.seg) { S.seg = d.seg; return render(); }
    if (d.kind) { S.kind = d.kind; return render(); }
    if (d.proj) { S.proj = d.proj; return render(); }
    if (d.sector) { S.kind = "all"; return go("opps", { sector: d.sector }); }
    if (d.ptab) { cur().p.t = d.ptab; return render(); }
    if (d.stab) { S.savedTab = d.stab; return render(); }
    if (d.step) { saveC(); const order = ["calcSurface", "calcSystem", "calcResult"]; const from = order.indexOf(cur().name), to = order.indexOf(d.step); if (to === from) return; S.stack.pop(); S.stack.push({ name: d.step, p: {} }); return render(to < from ? "back" : "fwd"); }
    if (d.city) { cur().p.city = cur().p.city === d.city ? null : d.city; render(); const hs = document.querySelector(".mapbox"); if (hs && cur().p.city) window.scrollTo({ top: hs.getBoundingClientRect().bottom + window.scrollY - 120, behavior: "smooth" }); return; }
    if (d.cmode) { if (d.cmode === "area" && C.mode === "ton" && areaOf() > 0) C.area = Math.round(areaOf()); C.mode = d.cmode; saveC(); return render(); }
    if (d.m2t) { C.m2t = num(d.m2t); saveC(); return render(); }
    if (d.loss) { C.loss = num(d.loss); saveC(); return render(); }
    if (d.cdel) { if (C.layers.length > 1) { C.layers.splice(+d.cdel, 1); saveC(); render(); } else toast("En az bir kat olmalı"); return; }
    const dr = cur().p.draft;
    if (d.locc) { dr.sel.has(d.locc) ? dr.sel.delete(d.locc) : dr.sel.add(d.locc); return render(); }
    if (d.locr) { const cs = REGIONS.find(([r]) => r === d.locr)[1], all = cs.every(c => dr.sel.has(c)); cs.forEach(c => all ? dr.sel.delete(c) : dr.sel.add(c)); return render(); }
    if (d.loco) { dr.open = dr.open === d.loco ? null : d.loco; return render(); }
    const a = d.act;
    if (a === "locAll" || a === "locNone") { dr.sel.clear(); return render(); }
    if (a === "locMine") { const on = MINE.every(c => dr.sel.has(c)); MINE.forEach(c => on ? dr.sel.delete(c) : dr.sel.add(c)); return render(); }
    if (a === "locApply") { S.loc = new Set(dr.sel); store.set("loc", [...S.loc]); S.seg = "all"; toast(S.loc.size ? "Konum filtresi uygulandı" : "Tüm konumlar gösteriliyor"); return back(); }
    if (a === "onbNext") { cur().p.k = (cur().p.k || 0) + 1; return render("fwd"); }
    if (a === "onbDone") { S.onboarded = true; store.set("onboarded", true); return go(S.user ? "home" : "login", {}, { root: true }); }
    if (a === "pwToggle") { const inp = t.parentElement.querySelector("input"); inp.type = inp.type === "password" ? "text" : "password"; t.innerHTML = ic(inp.type === "password" ? "eye" : "eyeoff", "ic sm"); return; }
    if (a === "guest") { return go("home", {}, { root: true }); }
    if (a === "apple") return toast("Apple ile giriş, App Store sürümünde açılacak");
    if (a === "forgot") { const em = document.querySelector('[name="email"]').value.trim(); if (!/\S+@\S+\.\S+/.test(em)) { $("ferr").textContent = "Şifre sıfırlama için önce e-postanı yaz."; return; } try { await auth("recover", { email: em }); toast("Sıfırlama bağlantısı e-postana gönderildi"); } catch (er) { $("ferr").textContent = AUTH_ERR(er.message); } return; }
    if (a === "lang") { const cl = window.NPLang ? NPLang.get() : "tr"; return sheet('<h2>Dil · Language</h2><div class="rows" style="margin-top:12px">' + [["tr", "Türkçe"], ["en", "English"]].map(([k, l]) => '<button class="row" data-act="setLang" data-l="' + k + '"><span class="rt"><b>' + l + '</b></span><span class="cbox' + (cl === k ? " on" : "") + '"></span></button>').join("") + '</div><p class="hint" style="margin-top:10px">Haber başlık ve özetleri kaynağın dilinde gösterilir. · Story titles and summaries are shown in the source language.</p>'); }
    if (a === "setLang") { closeSheet(); if (window.NPLang) NPLang.set(d.l); return; }
    if (a === "goSaved") return go("saved");
    if (a === "goMap") return go("map");
    if (a === "goLogin") return go("login");
    if (a === "goSettings") return go("settings");
    if (a === "goHelp") return go("help");
    if (a === "goAbout") return go("about");
    if (a === "logout") { setUser(null, null); toast("Çıkış yapıldı"); return render(); }
    if (a === "editProfile") return sheet('<h2>Profil bilgileri</h2><form class="stack" data-form="profile" style="margin-top:12px"><label class="field"><span class="lbl">Ad soyad</span><span class="input"><input name="name" value="' + esc(S.user.name || "") + '" autocomplete="name"></span></label><label class="field"><span class="lbl">E-posta</span><span class="input"><input value="' + esc(S.user.email || "") + '" disabled></span></label><button class="btn" type="submit">Kaydet</button></form>');
    if (a === "notifPrefs") return sheet('<h2>Bildirim tercihleri</h2><p class="lead" style="margin-bottom:12px">Bildirimler App Store sürümünde açılacak; tercihlerin şimdiden kaydedilir.</p><div class="rows">' + [["region", "Bölgemdeki fırsatlar", "75+ puanlı bölge haberleri"], ["tender", "Yaklaşan ihaleler", "Son teklife 10 günden az kalanlar"], ["weekly", "Haftalık özet", "Pazartesi sabahı"]].map(([k, t, s]) => '<label class="row"><span class="rt"><b>' + t + '</b><small>' + s + '</small></span><input type="checkbox" class="switch" data-notif="' + k + '"' + (S.notif[k] ? " checked" : "") + '></label>').join("") + '</div>');
    if (a === "sheetClose") return closeSheet();
    if (a === "addLayer") { C.layers.push(L3("Kat " + (C.layers.length + 1), "", "")); saveC(); render(); setTimeout(() => { const ls = document.querySelectorAll(".layer"); ls[ls.length - 1].scrollIntoView({ behavior: "smooth", block: "center" }); }, 50); return; }
    if (a === "shareCalc") return share("Boya hesabı", null, calcText(cur().p.calc || C));
    if (a === "saveCalc") return sheet('<h2>Hesabı kaydet</h2><form class="stack" data-form="saveCalc" style="margin-top:12px"><label class="field"><span class="lbl">Hesap adı</span><span class="input"><input name="name" value="' + esc("Hesap · " + f(areaOf(), 0) + " m²") + '"></span></label><button class="btn" type="submit">Kaydet</button></form>');
    if (a === "openCalc") return go("calcResult", { calc: S.calcs[+d.k].c });
    if (a === "loadCalc") { C = JSON.parse(JSON.stringify(cur().p.calc)); saveC(); return go("calcSurface", {}, { replace: true }); }
    if (a === "delCalc") { S.calcs.splice(+d.k, 1); store.set("calcs", S.calcs); toast("Hesap silindi"); return render(); }
    if (a === "savedCalcs") { S.savedTab = "calcs"; return tab("saved"); }
    if (a === "mapReset") { cur().p.city = null; return render(); }
    if (a === "mapTr" || a === "mapMm") { cur().p.zoom = a === "mapMm" ? "mm" : "tr"; return render(); }
  });

  document.addEventListener("input", e => {
    const t = e.target, d = t.dataset || {};
    if (d.q) { S.q = t.value; return doSearch(); }
    if (d.locq) { cur().p.draft.q = t.value; const pos = t.selectionStart; render(); const q = document.querySelector("[data-locq]"); q.focus(); q.setSelectionRange(pos, pos); return; }
    if (d.cf) {
      C[d.cf] = t.value; saveC(); refreshCalc();
      if (d.cf === "m2t") document.querySelectorAll("[data-m2t]").forEach(b => b.setAttribute("aria-pressed", String(num(b.dataset.m2t) === num(t.value))));
      if (d.cf === "loss") document.querySelectorAll("[data-loss]").forEach(b => b.setAttribute("aria-pressed", String(num(b.dataset.loss) === num(t.value))));
      return;
    }
    if (d.cl) {
      const [i, k] = d.cl.split("."), l = C.layers[+i];
      const setF = (sel, v) => { const x = document.querySelector(sel); if (x && x !== document.activeElement) x.value = v; };
      if (k === "wft") { const w = num(t.value), v = num(l.vs); l.dft = w > 0 && v > 0 ? Math.round(w * v / 100) : ""; setF('[data-cl="' + i + '.dft"]', l.dft); }
      else { l[k] = t.value; if (k === "dft" || k === "vs") setF('[data-cl="' + i + '.wft"]', wftOf(l)); }
      saveC(); return;
    }
  });
  document.addEventListener("change", e => {
    const t = e.target, d = t.dataset || {};
    if (d.hide) { S.hidden = t.checked ? S.hidden.filter(x => x !== d.hide) : [...S.hidden, d.hide]; store.set("hidden", S.hidden); S.seg = "all"; return; }
    if (d.notif) { S.notif[d.notif] = t.checked; store.set("notif", S.notif); return; }
  });
  document.addEventListener("submit", async e => {
    const fm = e.target, kind = fm.dataset.form; if (!kind) return;
    e.preventDefault();
    const v = Object.fromEntries(new FormData(fm)), err = $("ferr"), btn = fm.querySelector('[type="submit"]');
    const fail = m => { if (err) err.textContent = m; };
    if (kind === "login" || kind === "signup") {
      if (!/\S+@\S+\.\S+/.test(v.email || "")) return fail("Geçerli bir e-posta yaz.");
      if ((v.password || "").length < (kind === "signup" ? 8 : 1)) return fail(kind === "signup" ? "Şifre en az 8 karakter olmalı." : "Şifreni yaz.");
      if (kind === "signup" && !(v.name || "").trim()) return fail("Adını yaz.");
      if (kind === "signup" && !fm.querySelector('[name="terms"]').checked) return fail("Devam etmek için koşulları kabul et.");
      btn.disabled = true; fail("");
      try {
        if (kind === "login") {
          const j = await auth("token?grant_type=password", { email: v.email, password: v.password });
          setUser({ name: (j.user && j.user.user_metadata && j.user.user_metadata.name) || v.email.split("@")[0], email: v.email }, { access_token: j.access_token, refresh_token: j.refresh_token });
          toast("Hoş geldin, " + displayName()); go("home", {}, { root: true });
        } else {
          const j = await auth("signup", { email: v.email, password: v.password, data: { name: v.name.trim() } });
          if (j.access_token) { setUser({ name: v.name.trim(), email: v.email }, { access_token: j.access_token, refresh_token: j.refresh_token }); toast("Hesabın oluşturuldu"); go("home", {}, { root: true }); }
          else { toast("Onay bağlantısı e-postana gönderildi"); setUser({ name: v.name.trim(), email: v.email, pending: true }, null); go("home", {}, { root: true }); }
        }
      } catch (er) { fail(AUTH_ERR(er.message)); } finally { btn.disabled = false; }
      return;
    }
    if (kind === "profile") { S.user.name = (v.name || "").trim() || S.user.name; store.set("user", S.user); closeSheet(); toast("Profil güncellendi"); return render(); }
    if (kind === "saveCalc") { S.calcs.unshift({ name: (v.name || "Hesap").trim(), d: fdate(new Date().toISOString().slice(0, 10)), c: JSON.parse(JSON.stringify(C)) }); store.set("calcs", S.calcs); closeSheet(); toast("Hesap Kayıtlılar'a eklendi"); return; }
  });

  function share(title, url, text) {
    const Pl = window.Capacitor && window.Capacitor.Plugins, native = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    const payload = { title, text: text || title, url: url || undefined };
    if (native && Pl && Pl.Share) return Pl.Share.share(payload).catch(() => { });
    if (navigator.share) return navigator.share(payload).catch(() => { });
    try { navigator.clipboard.writeText(text || url || title); toast("Panoya kopyalandı"); } catch (_) { toast("Paylaşım bu cihazda desteklenmiyor"); }
  }

  /* ---------- Başlangıç ---------- */
  window.NPApp = { go, tab, back, state: S, rerender: () => render() };
  S.stack = [{ name: "splash", p: {} }];
  render();
  setTimeout(() => { if (cur().name === "splash") go(S.onboarded ? "home" : "onboarding", { k: 0 }, { root: true }); }, 1400);
})();
