/* NEWSPENGUEN uygulama eklentisi: Boya Hesapla (sarfiyat ve maliyet) ve uygulamaya özel arayüz düzeltmeleri.
   Yalnızca iOS uygulamasının www/ kopyasına eklenir; web sitesindeki index.html değişmez.
   index.html'in global'lerini kullanır: S, P, ic, esc, go, render, store, $. */
(function () {
  if (typeof render !== "function" || typeof S === "undefined") return;

  P.calc = '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.5M8.5 18h.01M12 18h.01"/>';
  P.plus = '<path d="M12 5v14M5 12h14"/>';
  P.trash = '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>';
  P.roller = '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h2.5v5.5H11V15"/><rect x="9.5" y="15" width="3" height="6" rx="1"/>';

  /* ---------- hesap motoru ---------- */
  const METHODS = {
    brush: { l: "Fırça / rulo", loss: 10 },
    airless: { l: "Airless", loss: 25 },
    air: { l: "Havalı tabanca", loss: 40 },
    custom: { l: "Özel", loss: null }
  };
  const PRESETS = {
    deco: { name: "Dekoratif iç cephe", mode: "liquid", area: 250, method: "brush", layers: [
      { n: "Astar", dft: 30, vs: 32, coats: 1, pack: 15, price: 0 },
      { n: "Son kat (akrilik/emülsiyon)", dft: 35, vs: 38, coats: 2, pack: 15, price: 0 }] },
    facade: { name: "Dış cephe", mode: "liquid", area: 600, method: "brush", layers: [
      { n: "Dış cephe astarı", dft: 35, vs: 35, coats: 1, pack: 15, price: 0 },
      { n: "Dış cephe son kat", dft: 40, vs: 40, coats: 2, pack: 15, price: 0 }] },
    c3: { name: "Protective C3 (çelik)", mode: "liquid", area: 1000, method: "airless", layers: [
      { n: "Epoksi astar", dft: 80, vs: 55, coats: 1, pack: 20, price: 0 },
      { n: "Epoksi ara kat", dft: 120, vs: 80, coats: 1, pack: 20, price: 0 },
      { n: "Poliüretan son kat", dft: 60, vs: 55, coats: 1, pack: 20, price: 0 }] },
    c5: { name: "Protective C5 (çinkolu)", mode: "liquid", area: 1000, method: "airless", layers: [
      { n: "Çinko epoksi astar", dft: 60, vs: 60, coats: 1, pack: 20, price: 0 },
      { n: "Epoksi ara kat", dft: 160, vs: 80, coats: 1, pack: 20, price: 0 },
      { n: "Poliüretan son kat", dft: 60, vs: 55, coats: 1, pack: 20, price: 0 }] },
    marine: { name: "Marine su altı", mode: "liquid", area: 3000, method: "airless", layers: [
      { n: "Antikorozif epoksi", dft: 125, vs: 70, coats: 2, pack: 20, price: 0 },
      { n: "Bağlayıcı kat", dft: 75, vs: 55, coats: 1, pack: 20, price: 0 },
      { n: "Zehirsiz/antifouling", dft: 100, vs: 55, coats: 2, pack: 20, price: 0 }] },
    powder: { name: "Toz boya", mode: "powder", area: 500, density: 1.5, dft: 70, eff: 65, pack: 20, price: 0 }
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  let C = store.get("calc", null) || clone(PRESETS.c3);
  if (!C.layers && C.mode !== "powder") C = clone(PRESETS.c3);
  const save = () => store.set("calc", C);
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : 0; };
  const f = (n, d = 1) => (isFinite(n) ? n : 0).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const loss = () => C.method === "custom" ? num(C.loss) : METHODS[C.method || "brush"].loss;

  function calcLiquid() {
    const A = num(C.area), L = Math.min(Math.max(loss(), 0), 90) / 100;
    const rows = C.layers.map(l => {
      const dft = num(l.dft), vs = num(l.vs), coats = Math.max(1, Math.round(num(l.coats)) || 1);
      const theo = vs > 0 && dft > 0 ? (vs * 10) / dft : 0;           // m²/L teorik yayılma
      const prac = theo * (1 - L);                                       // m²/L pratik yayılma
      const liters = prac > 0 ? (A * coats) / prac : 0;
      const pack = num(l.pack), price = num(l.price);
      const cans = pack > 0 ? Math.ceil(liters / pack - 1e-9) : 0;
      const wft = vs > 0 ? (dft * 100) / vs : 0;
      return { n: l.n, dft, vs, coats, theo, prac, liters, pack, cans, wft, price, cost: price > 0 ? (pack > 0 ? cans * pack : liters) * price : 0, totDft: dft * coats };
    });
    return { A, L, rows, liters: rows.reduce((s, r) => s + r.liters, 0), cost: rows.reduce((s, r) => s + r.cost, 0), dft: rows.reduce((s, r) => s + r.totDft, 0) };
  }
  function calcPowder() {
    const A = num(C.area), rho = num(C.density), dft = num(C.dft), eff = Math.min(Math.max(num(C.eff), 1), 100) / 100;
    const theo = rho > 0 && dft > 0 ? 1000 / (rho * dft) : 0;          // m²/kg teorik
    const prac = theo * eff;
    const kg = prac > 0 ? A / prac : 0;
    const pack = num(C.pack), price = num(C.price);
    const boxes = pack > 0 ? Math.ceil(kg / pack - 1e-9) : 0;
    return { A, theo, prac, kg, boxes, pack, cost: price > 0 ? (pack > 0 ? boxes * pack : kg) * price : 0 };
  }

  /* ---------- görünüm ---------- */
  const inp = (key, val, unit, opts = "") => '<label class="cf"><span>' + key[1] + '</span><span class="ciw"><input inputmode="decimal" data-cf="' + key[0] + '" value="' + esc(String(val ?? "")) + '" ' + opts + '><em>' + unit + '</em></span></label>';
  const linp = (i, k, label, val, unit) => '<label class="cf"><span>' + label + '</span><span class="ciw"><input inputmode="decimal" data-cl="' + i + '.' + k + '" value="' + esc(String(val ?? "")) + '"><em>' + unit + '</em></span></label>';

  function viewCalc() {
    const pw = C.mode === "powder";
    let h = '<p class="clead">Alan ve ürün teknik föyündeki değerlerle gereken boya miktarını, ambalaj sayısını ve maliyeti hesapla.</p>';
    h += '<div class="cpre" role="group" aria-label="Hazır sistemler">' + Object.entries(PRESETS).map(([k, p]) => '<button class="chip" data-cpre="' + k + '" aria-pressed="' + (C.preset === k) + '">' + esc(p.name) + '</button>').join("") + '</div>';
    h += '<div class="seg3 cmode" role="group" aria-label="Boya tipi"><button data-cmode="liquid" aria-pressed="' + !pw + '">Sıvı boya</button><button data-cmode="powder" aria-pressed="' + pw + '">Toz boya</button></div>';
    h += '<section class="ccard"><div class="cgrid">' + inp(["area", "Boyanacak alan"], C.area, "m²");
    if (pw) {
      h += inp(["dft", "Film kalınlığı (DFT)"], C.dft, "µm") + inp(["density", "Özgül ağırlık"], C.density, "g/cm³") + inp(["eff", "Transfer verimi"], C.eff, "%") + inp(["pack", "Kutu"], C.pack, "kg") + inp(["price", "Birim fiyat"], C.price || "", "₺/kg", 'placeholder="isteğe bağlı"');
    } else {
      h += '<label class="cf"><span>Uygulama yöntemi</span><select data-cf="method">' + Object.entries(METHODS).map(([k, m]) => '<option value="' + k + '"' + (C.method === k ? " selected" : "") + '>' + m.l + (m.loss != null ? " · %" + m.loss : "") + '</option>').join("") + '</select></label>';
      if (C.method === "custom") h += inp(["loss", "Kayıp / fire"], C.loss ?? 20, "%");
    }
    h += '</div></section>';
    if (!pw) {
      h += C.layers.map((l, i) => '<section class="ccard"><div class="chead"><input class="cname" data-cl="' + i + '.n" value="' + esc(l.n) + '" aria-label="Kat adı"><button class="cdel" data-cdel="' + i + '" aria-label="Katı sil">' + ic("trash") + '</button></div><div class="cgrid">' +
        linp(i, "dft", "Kuru film (DFT)", l.dft, "µm") + linp(i, "vs", "Hacimce katı madde", l.vs, "%") + linp(i, "coats", "Kat sayısı", l.coats, "kat") + linp(i, "pack", "Ambalaj", l.pack, "L") + linp(i, "price", "Birim fiyat", l.price || "", "₺/L") + '</div></section>').join("");
      h += '<button class="cadd" data-cadd="1">' + ic("plus") + 'Kat ekle</button>';
    }
    h += '<section class="cres" id="cres" aria-live="polite"></section>';
    h += '<button class="csum" id="csum" data-cgo="1" aria-label="Sonuca git"></button>';
    h += '<p class="foot">Teorik yayılma = katı madde × 10 ÷ DFT. Hazır sistemlerdeki değerler tipiktir; kesin sonuç için ürünün teknik föyünü kullan.</p>';
    return h;
  }

  function resultsHTML() {
    if (C.mode === "powder") {
      const r = calcPowder();
      return '<div class="ctot"><div><small>Gereken toz boya</small><b>' + f(r.kg) + ' kg</b></div><div><small>Kutu</small><b>' + (r.boxes || "–") + '</b></div><div><small>Maliyet</small><b>' + (r.cost ? f(r.cost, 0) + " ₺" : "–") + '</b></div></div>' +
        '<div class="crow"><span>Teorik yayılma</span><b>' + f(r.theo, 2) + ' m²/kg</b></div><div class="crow"><span>Pratik yayılma</span><b>' + f(r.prac, 2) + ' m²/kg</b></div>' +
        '<button class="btn cshare" data-cshare="1">' + ic("share") + 'Sonucu paylaş</button>';
    }
    const r = calcLiquid();
    return '<div class="ctot"><div><small>Toplam boya</small><b>' + f(r.liters) + ' L</b></div><div><small>Toplam DFT</small><b>' + f(r.dft, 0) + ' µm</b></div><div><small>Maliyet</small><b>' + (r.cost ? f(r.cost, 0) + " ₺" : "–") + '</b></div></div>' +
      r.rows.map(x => '<div class="cl"><div class="crow"><b>' + esc(x.n || "Kat") + '</b><b>' + f(x.liters) + ' L' + (x.cans ? ' · ' + x.cans + ' × ' + f(x.pack, 0) + ' L' : '') + '</b></div><div class="csub">Teorik ' + f(x.theo, 2) + ' m²/L · pratik ' + f(x.prac, 2) + ' m²/L · yaş film ' + f(x.wft, 0) + ' µm' + (x.cost ? ' · ' + f(x.cost, 0) + ' ₺' : '') + '</div></div>').join("") +
      '<div class="csub">Kayıp payı: %' + f(r.L * 100, 0) + ' · Alan: ' + f(r.A, 0) + ' m²</div>' +
      '<button class="btn cshare" data-cshare="1">' + ic("share") + 'Sonucu paylaş</button>';
  }
  function shareText() {
    if (C.mode === "powder") {
      const r = calcPowder();
      return "NEWSPENGUEN boya hesabı (toz boya)\nAlan: " + f(r.A, 0) + " m², DFT " + f(num(C.dft), 0) + " µm\nGereken: " + f(r.kg) + " kg" + (r.boxes ? " (" + r.boxes + " × " + f(r.pack, 0) + " kg)" : "") + (r.cost ? "\nMaliyet: " + f(r.cost, 0) + " ₺" : "");
    }
    const r = calcLiquid();
    return "NEWSPENGUEN boya hesabı\nAlan: " + f(r.A, 0) + " m², " + METHODS[C.method].l + ", kayıp %" + f(r.L * 100, 0) + "\n" +
      r.rows.map(x => "• " + (x.n || "Kat") + ": " + x.coats + " × " + f(x.dft, 0) + " µm → " + f(x.liters) + " L" + (x.cans ? " (" + x.cans + " × " + f(x.pack, 0) + " L)" : "")).join("\n") +
      "\nToplam: " + f(r.liters) + " L, toplam DFT " + f(r.dft, 0) + " µm" + (r.cost ? "\nMaliyet: " + f(r.cost, 0) + " ₺" : "");
  }
  function sumHTML() {
    if (C.mode === "powder") { const r = calcPowder(); return '<span>Toplam</span><b>' + f(r.kg) + ' kg' + (r.boxes ? ' · ' + r.boxes + ' kutu' : '') + (r.cost ? ' · ' + f(r.cost, 0) + ' ₺' : '') + '</b>' + ic("chev"); }
    const r = calcLiquid(); return '<span>Toplam</span><b>' + f(r.liters) + ' L · ' + f(r.dft, 0) + ' µm' + (r.cost ? ' · ' + f(r.cost, 0) + ' ₺' : '') + '</b>' + ic("chev");
  }
  const refresh = () => {
    const el = document.getElementById("cres"); if (el) el.innerHTML = resultsHTML();
    const sm = document.getElementById("csum"); if (sm) sm.innerHTML = sumHTML();
  };
  // Sonuç kartı görünürken alttaki özet şeridini gizle
  let io = null;
  const watch = () => {
    if (io) io.disconnect();
    const el = document.getElementById("cres"), sm = document.getElementById("csum");
    if (!el || !sm || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(es => sm.classList.toggle("hide", es[0].isIntersecting), { threshold: 0.15 });
    io.observe(el);
  };

  /* ---------- olaylar ---------- */
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.cf) { C[t.dataset.cf] = t.value; C.preset = null; save(); if (t.dataset.cf === "method") { render(); return; } refresh(); }
    else if (t.dataset.cl) { const [i, k] = t.dataset.cl.split("."); C.layers[+i][k] = t.value; C.preset = null; save(); refresh(); }
  });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-cpre],[data-cmode],[data-cadd],[data-cdel],[data-cshare],[data-cgo]");
    if (!b) return;
    const d = b.dataset;
    if (d.cgo) { document.getElementById("cres").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (d.cpre) { C = clone(PRESETS[d.cpre]); C.preset = d.cpre; }
    else if (d.cmode) { if (d.cmode !== C.mode) { C = clone(d.cmode === "powder" ? PRESETS.powder : PRESETS.c3); } }
    else if (d.cadd) { C.layers.push({ n: "Kat " + (C.layers.length + 1), dft: 60, vs: 55, coats: 1, pack: 20, price: 0 }); C.preset = null; }
    else if (d.cdel) { if (C.layers.length > 1) C.layers.splice(+d.cdel, 1); C.preset = null; }
    else if (d.cshare) {
      const txt = shareText(), Pl = window.Capacitor && window.Capacitor.Plugins;
      if (Pl && Pl.Share && window.Capacitor.isNativePlatform()) Pl.Share.share({ title: "Boya hesabı", text: txt }).catch(() => {});
      else if (navigator.share) navigator.share({ text: txt }).catch(() => {});
      else try { navigator.clipboard.writeText(txt); b.lastChild.textContent = "Kopyalandı"; } catch (_) {}
      return;
    }
    save(); render();
  });

  /* ---------- konum filtresi: bölge ve il ---------- */
  const REGIONS = [
    ["Marmara", ["İstanbul", "Edirne", "Kırklareli", "Tekirdağ", "Çanakkale", "Kocaeli", "Yalova", "Sakarya", "Bilecik", "Bursa", "Balıkesir"]],
    ["Ege", ["İzmir", "Manisa", "Aydın", "Denizli", "Muğla", "Afyonkarahisar", "Kütahya", "Uşak"]],
    ["Akdeniz", ["Antalya", "Isparta", "Burdur", "Mersin", "Adana", "Hatay", "Osmaniye", "Kahramanmaraş"]],
    ["İç Anadolu", ["Ankara", "Konya", "Karaman", "Aksaray", "Niğde", "Nevşehir", "Kırşehir", "Kırıkkale", "Kayseri", "Sivas", "Yozgat", "Çankırı", "Eskişehir"]],
    ["Karadeniz", ["Zonguldak", "Karabük", "Bartın", "Kastamonu", "Sinop", "Samsun", "Ordu", "Giresun", "Trabzon", "Rize", "Artvin", "Gümüşhane", "Bayburt", "Tokat", "Amasya", "Çorum", "Bolu", "Düzce"]],
    ["Doğu Anadolu", ["Erzurum", "Erzincan", "Kars", "Ardahan", "Iğdır", "Ağrı", "Van", "Muş", "Bitlis", "Bingöl", "Elazığ", "Malatya", "Tunceli", "Hakkari"]],
    ["Güneydoğu Anadolu", ["Gaziantep", "Kilis", "Adıyaman", "Şanlıurfa", "Diyarbakır", "Mardin", "Batman", "Siirt", "Şırnak"]]
  ];
  const ABROAD = "Yurt dışı";
  // İl adı geçmeyen haberler için ilçe ve kurum anahtar kelimeleri
  const ALIAS = {
    "İstanbul": ["ibb", "iski", "i̇bb", "i̇ski", "çatalca", "silivri", "arnavutköy", "hadımköy", "beyoğlu", "başakşehir", "bayrampaşa", "esenyurt", "büyükçekmece", "küçükçekmece", "avcılar", "beylikdüzü", "eyüpsultan", "sarıyer", "kağıthane", "şişli", "fatih", "zeytinburnu", "bakırköy", "bağcılar", "güngören", "esenler", "sultangazi", "gaziosmanpaşa", "kadıköy", "üsküdar", "ataşehir", "ümraniye", "maltepe", "kartal", "pendik", "tuzla", "beykoz", "çekmeköy", "sancaktepe", "sultanbeyli", "şile", "avrupa yakası", "anadolu yakası", "kuzey demir", "inrail"],
    "Tekirdağ": ["çorlu", "çerkezköy", "kapaklı", "ergene", "velimeşe", "hayrabolu", "malkara", "süleymanpaşa", "marmaraereğlisi", "şarköy", "muratlı", "saray"],
    "Edirne": ["keşan", "uzunköprü", "ipsala", "enez", "havsa", "yenimuhacir"],
    "Kırklareli": ["lüleburgaz", "babaeski", "vize", "pınarhisar", "demirköy"],
    "Kocaeli": ["gebze", "dilovası", "izmit", "i̇zmit", "körfez", "derince", "gölcük", "kartepe", "darıca", "çayırova", "uzmar"],
    "Bursa": ["gemlik", "inegöl", "mudanya", "mustafakemalpaşa", "nilüfer", "osmangazi", "orhangazi"],
    "Balıkesir": ["bandırma", "edremit", "ayvalık", "gönen"],
    "Çanakkale": ["biga", "lapseki", "gelibolu", "çan"],
    "Sakarya": ["adapazarı", "hendek", "karasu"],
    "İzmir": ["aliağa", "bergama", "torbalı", "kemalpaşa", "menemen", "çiğli", "star rafineri"],
    "Aydın": ["söke", "kuşadası", "nazilli", "didim"],
    "Muğla": ["bodrum", "fethiye", "marmaris", "milas", "dalaman"],
    "Mersin": ["tarsus", "silifke", "erdemli", "akkuyu"],
    "Hatay": ["iskenderun", "antakya", "dörtyol"],
    "Adana": ["ceyhan", "yumurtalık", "kozan"],
    "Şanlıurfa": ["birecik", "siverek", "viranşehir"],
    "Antalya": ["alanya", "manavgat", "kemer"],
    "Zonguldak": ["ereğli", "çaycuma"],
    "Kayseri": ["incesu"],
    "Konya": ["ereğli"]
  };
  const CITY_REGION = {};
  REGIONS.forEach(([r, cs]) => cs.forEach(c => (CITY_REGION[c] = r)));
  const L = "a-zçğıöşüâîû";
  const lc = t => String(t || "").toLocaleLowerCase("tr");
  const wordRx = w => new RegExp("(^|[^" + L + "])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![" + L + "])");
  const MATCHERS = Object.keys(CITY_REGION).map(c => [c, [lc(c)].concat(ALIAS[c] || []).map(wordRx)]);
  const cityCache = new Map();
  function citiesOf(i) {
    if (cityCache.has(i.id)) return cityCache.get(i.id);
    let out = [];
    if (i.reg && i.reg !== "tr") out = [ABROAD];
    else {
      const t = lc((i.company || "") + " " + i.title + " " + (i.summary || ""));
      for (const [c, rxs] of MATCHERS) if (rxs.some(rx => rx.test(t))) out.push(c);
      // "Ereğli" iki ilde var: hangisi olduğu belli değilse ikisini birden sayma
      if (out.includes("Zonguldak") && out.includes("Konya")) out = out.filter(c => c !== "Zonguldak" && c !== "Konya");
    }
    cityCache.set(i.id, out);
    return out;
  }
  let LOC = new Set(store.get("loc", []));
  const saveLoc = () => store.set("loc", [...LOC]);
  const locMatch = i => !LOC.size || citiesOf(i).some(c => LOC.has(c));
  function locLabel() {
    if (!LOC.size) return "Tüm konumlar";
    const sel = [...LOC];
    const fullRegions = REGIONS.filter(([, cs]) => cs.every(c => LOC.has(c))).map(([r]) => r);
    const rest = sel.filter(c => !fullRegions.includes(CITY_REGION[c]));
    const parts = fullRegions.concat(rest);
    return parts.length <= 2 ? parts.join(", ") : parts.slice(0, 2).join(", ") + " +" + (parts.length - 2);
  }
  const locBar = () => '<button class="locbar' + (LOC.size ? " on" : "") + '" data-loc="open">' + ic("pin") + '<span><small>Konum</small><b>' + esc(locLabel()) + '</b></span>' + (LOC.size ? '<span class="locx" data-loc="clear" role="button" aria-label="Konum filtresini temizle">×</span>' : ic("chev")) + '</button>';

  let sheetOpen = null; // açık bölge adı
  let draft = null;
  function sheetHTML() {
    const all = ITEMS.filter(i => !S.hidden.includes(i.seg));
    const cnt = {};
    all.forEach(i => citiesOf(i).forEach(c => (cnt[c] = (cnt[c] || 0) + 1)));
    const q = lc(draft.q || "");
    const n = all.filter(i => !draft.sel.size || citiesOf(i).some(c => draft.sel.has(c))).length;
    let h = '<div class="sh-h"><b>Konum seç</b><button data-loc="close" aria-label="Kapat">×</button></div>';
    h += '<input class="sh-q" type="search" placeholder="İl ara (ör. Tekirdağ)" value="' + esc(draft.q || "") + '" data-locq="1">';
    h += '<div class="sh-quick"><button class="chip" data-loc="mine" aria-pressed="' + ["İstanbul", "Tekirdağ", "Edirne", "Kırklareli"].every(c => draft.sel.has(c)) + '">★ Bölgem: İstanbul + Trakya</button><button class="chip" data-loc="abroad" aria-pressed="' + draft.sel.has(ABROAD) + '">🌍 Yurt dışı <span class="n">' + (cnt[ABROAD] || 0) + '</span></button></div>';
    h += '<div class="sh-list">';
    for (const [r, cs] of REGIONS) {
      const list = q ? cs.filter(c => lc(c).includes(q)) : cs;
      if (!list.length) continue;
      const rc = cs.reduce((s, c) => s + (cnt[c] || 0), 0);
      const selN = cs.filter(c => draft.sel.has(c)).length;
      const open = q || sheetOpen === r;
      h += '<div class="rg' + (open ? " open" : "") + '"><div class="rg-h"><button class="ck' + (selN === cs.length ? " on" : selN ? " part" : "") + '" data-locr="' + r + '" aria-label="' + r + ' bölgesinin tümünü seç"></button><button class="rg-t" data-loco="' + r + '"><b>' + r + '</b><small>' + rc + ' haber' + (selN ? ' · ' + selN + ' il seçili' : '') + '</small>' + ic("chev") + '</button></div>';
      if (open) h += '<div class="rg-c">' + list.slice().sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0) || a.localeCompare(b, "tr")).map(c => '<button class="city' + (draft.sel.has(c) ? " on" : "") + (cnt[c] ? "" : " zero") + '" data-locc="' + c + '">' + c + (cnt[c] ? ' <span>' + cnt[c] + '</span>' : '') + '</button>').join("") + '</div>';
      h += '</div>';
    }
    h += '</div><div class="sh-f"><button class="sh-clear" data-loc="none">Temizle</button><button class="btn sh-go" data-loc="apply">' + n + ' haberi göster</button></div>';
    return h;
  }
  function openSheet() {
    draft = { sel: new Set(LOC), q: "" };
    sheetOpen = REGIONS.find(([, cs]) => cs.some(c => LOC.has(c)))?.[0] || "Marmara";
    let el = document.getElementById("locsheet");
    if (!el) { el = document.createElement("div"); el.id = "locsheet"; el.className = "sheet"; document.body.appendChild(el); }
    el.innerHTML = '<div class="sh-bg" data-loc="close"></div><div class="sh-p" role="dialog" aria-modal="true" aria-label="Konum seç">' + sheetHTML() + '</div>';
    requestAnimationFrame(() => el.classList.add("show"));
    document.body.style.overflow = "hidden";
  }
  function redrawSheet(keepFocus) {
    const p = document.querySelector("#locsheet .sh-p"); if (!p) return;
    const sc = p.querySelector(".sh-list")?.scrollTop || 0;
    p.innerHTML = sheetHTML();
    const l = p.querySelector(".sh-list"); if (l) l.scrollTop = sc;
    if (keepFocus) { const q = p.querySelector(".sh-q"); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function closeSheet() {
    const el = document.getElementById("locsheet"); if (!el) return;
    el.classList.remove("show"); document.body.style.overflow = "";
    setTimeout(() => el.remove(), 220);
  }
  document.addEventListener("input", e => { if (e.target.dataset && e.target.dataset.locq) { draft.q = e.target.value; redrawSheet(true); } });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-loc],[data-locr],[data-loco],[data-locc]");
    if (!b) return;
    e.stopPropagation();
    const d = b.dataset;
    if (d.loc === "open") { openSheet(); return; }
    if (d.loc === "clear") { e.preventDefault(); LOC.clear(); saveLoc(); render(); return; }
    if (d.loc === "close") { closeSheet(); return; }
    if (d.loc === "apply") { LOC = new Set(draft.sel); saveLoc(); closeSheet(); S.slide = 0; render(); return; }
    if (d.loc === "none") draft.sel.clear();
    else if (d.loc === "mine") { const m = ["İstanbul", "Tekirdağ", "Edirne", "Kırklareli"]; const on = m.every(c => draft.sel.has(c)); m.forEach(c => on ? draft.sel.delete(c) : draft.sel.add(c)); }
    else if (d.loc === "abroad") draft.sel.has(ABROAD) ? draft.sel.delete(ABROAD) : draft.sel.add(ABROAD);
    else if (d.locr) { const cs = REGIONS.find(([r]) => r === d.locr)[1]; const all = cs.every(c => draft.sel.has(c)); cs.forEach(c => all ? draft.sel.delete(c) : draft.sel.add(c)); }
    else if (d.loco) sheetOpen = sheetOpen === d.loco ? null : d.loco;
    else if (d.locc) draft.sel.has(d.locc) ? draft.sel.delete(d.locc) : draft.sel.add(d.locc);
    redrawSheet(false);
  }, true);

  /* ---------- arayüz: sekmeler, başlık, profil ---------- */
  const TABS = [["home", "Ana Sayfa", "home"], ["sectors", "Sektörler", "layers"], ["projects", "Projeler", "brief"], ["calc", "Hesapla", "calc"], ["saved", "Kayıtlı", "bm"]];
  const LOC_VIEWS = ["home", "sectors", "projects"];
  const origRender = render;
  function renderFiltered() {
    // Konum filtresi: ITEMS'ı yalnızca çizim süresince süzer, sonra geri koyar
    if (!LOC.size || !LOC_VIEWS.includes(S.view)) return origRender();
    const all = ITEMS.slice();
    const keep = all.filter(locMatch);
    ITEMS.length = 0; ITEMS.push(...keep);
    try { origRender(); } finally { ITEMS.length = 0; ITEMS.push(...all); }
  }
  render = function () {
    const v = S.view;
    if (v !== "calc" && io) { io.disconnect(); io = null; }
    if (v === "calc") {
      $("top").innerHTML = '<div class="bar"><h1 class="pagetitle">Boya Hesapla</h1><button class="av" data-view="profile" aria-label="Profil">R</button></div>';
      $("main").innerHTML = viewCalc();
      refresh(); watch();
    } else {
      renderFiltered();
      // İşlevsiz zil düğmesini kaldır
      document.querySelectorAll('#top .rb[aria-label="Bildirimler"]').forEach(x => x.remove());
      if (LOC_VIEWS.includes(v)) {
        if (v === "home") {
          const chips = document.querySelector("#top .chips");
          if (chips) chips.insertAdjacentHTML("beforebegin", locBar());
          // Ana sayfadan Boya Hesapla kısayolu
          const sec = document.querySelector("#main .sec");
          if (sec) sec.insertAdjacentHTML("beforebegin", '<button class="calcpromo" data-view="calc"><span class="cp-i">' + ic("calc") + '</span><span><b>Boya Hesapla</b><small>Sarfiyat, kutu sayısı ve maliyet</small></span>' + ic("chev") + '</button>');
        } else {
          $("main").insertAdjacentHTML("afterbegin", locBar());
        }
        if (LOC.size && !$("main").textContent.trim()) $("main").insertAdjacentHTML("beforeend", '<div class="empty">Seçtiğin konumda haber yok.</div>');
      }
      if (v === "profile") {
        document.querySelectorAll("#main .row").forEach(r => {
          const t = r.querySelector("b"); if (!t) return;
          if (/Bildirim Tercihleri/.test(t.textContent)) r.remove();
          else if (/Bölge Ayarları/.test(t.textContent)) { r.dataset.loc = "open"; t.textContent = "Konum filtresi"; r.querySelector("small").textContent = locLabel(); }
        });
        const about = [...document.querySelectorAll("#main .row")].find(r => /Uygulama Hakkında/.test(r.textContent));
        if (about) about.insertAdjacentHTML("afterend", '<p class="foot" style="margin-top:8px">NEWSPENGUEN iOS · sürüm 1.0<br>Haberler 6 saatte bir güncellenir. Kişisel veri toplanmaz; kayıtlar yalnızca bu cihazda tutulur.</p>');
      }
    }
    const tab = { article: S.prev, search: "home", profile: null }[v] ?? v;
    $("nav").innerHTML = TABS.map(([k, l, n]) => '<button data-view="' + k + '"' + (tab === k ? ' aria-current="page"' : '') + '>' + ic(n) + l + '</button>').join("");
  };
  render();
})();
