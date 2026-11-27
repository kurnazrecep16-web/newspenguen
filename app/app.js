/* NEWSPENGUEN uygulama eklentisi: Boya Hesapla (sarfiyat ve maliyet) ve uygulamaya özel arayüz düzeltmeleri.
   Yalnızca iOS uygulamasının www/ kopyasına eklenir; web sitesindeki index.html değişmez.
   index.html'in global'lerini kullanır: S, P, ic, esc, go, render, store, $. */
(function () {
  if (typeof render !== "function" || typeof S === "undefined") return;

  P.calc = '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.5M8.5 18h.01M12 18h.01"/>';
  P.plus = '<path d="M12 5v14M5 12h14"/>';
  P.trash = '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>';
  P.roller = '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h2.5v5.5H11V15"/><rect x="9.5" y="15" width="3" height="6" rx="1"/>';

  /* ---------- hesap motoru (Protective) ----------
     Teorik yayılma (m²/L) = hacimce katı madde (%) × 10 ÷ DFT (µm)
     Pratik yayılma = teorik × (1 − fire %)       Yaş film (WFT, µm) = DFT × 100 ÷ katı madde
     Maliyet/m² = fiyat ($/L) ÷ pratik yayılma     (Hempel, Wattyl ve ISO 12944 pratiğine göre) */
  const L3 = (n, dft, vs, coats = 1) => ({ n, dft, vs, coats, price: "" });
  const DEFAULT_LAYERS = [L3("Astar", 60, 58), L3("Ara kat", 120, 75), L3("Son kat", 60, 55)];
  const clone = o => JSON.parse(JSON.stringify(o));
  let C = store.get("calc4", null);
  if (!C || !Array.isArray(C.layers)) C = { mode: "ton", ton: 100, m2t: 20, area: 1000, loss: 30, layers: clone(DEFAULT_LAYERS) };
  const save = () => store.set("calc4", C);
  const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const f = (n, d = 1) => (isFinite(n) ? n : 0).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const usd = (n, d = 0) => "$" + f(n, d);
  const wftOf = l => { const d = num(l.dft), v = num(l.vs); return d > 0 && v > 0 ? Math.round(d * 100 / v) : ""; };

  function calc() {
    const A = areaOf(), L = Math.min(Math.max(num(C.loss), 0), 90) / 100;
    const rows = C.layers.map(l => {
      const dft = num(l.dft), vs = num(l.vs), coats = Math.max(1, Math.round(num(l.coats)) || 1), price = num(l.price);
      const theo = vs > 0 && dft > 0 ? (vs * 10) / dft : 0, prac = theo * (1 - L);
      const liters = prac > 0 ? (A * coats) / prac : 0;
      return { n: l.n, dft, vs, coats, theo, prac, liters, price, wft: wftOf(l), cost: liters * price, cpm: price > 0 && prac > 0 ? (price * coats) / prac : 0, tot: dft * coats };
    });
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    return { A, L, rows, liters: sum("liters"), cost: sum("cost"), cpm: sum("cpm"), dft: sum("tot") };
  }

  /* ---------- alan: tonajdan veya doğrudan m² ---------- */
  const STEEL = [["Ağır profil", "HEB, HEM, kalın sac", 12], ["Orta profil", "IPE, HEA", 20], ["Hafif profil", "köşebent, U, boru", 35], ["İnce sac", "kafes, ince levha", 50]];
  const areaOf = () => C.mode === "ton" ? num(C.ton) * num(C.m2t) : num(C.area);

  /* ---------- görünüm ---------- */
  const step = (n, t, s) => '<div class="step"><span class="stn">' + n + '</span><div><b>' + t + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div></div>';
  const lin = (i, k, label, val, unit, hint) => '<label class="cf"><span>' + label + '</span><span class="ciw"><input inputmode="decimal" data-cl="' + i + '.' + k + '" value="' + esc(String(val ?? "")) + '" placeholder="0"><em>' + unit + '</em></span>' + (hint ? '<i class="hint">' + hint + '</i>' : '') + '</label>';

  function viewCalc() {
    let h = '<p class="clead">Çelik tonajından veya yüzey alanından protective boya sarfiyatını ve maliyetini hesapla. Değerleri ürünün teknik föyünden al.</p>';
    const ton = C.mode === "ton";
    h += step(1, "Yüzey alanı", ton ? "Çelik tonajından otomatik hesaplanır" : "Boyanacak alanı doğrudan gir");
    h += '<section class="ccard"><div class="seg3 hseg" role="group" aria-label="Alan girişi"><button data-cmode="ton" aria-pressed="' + ton + '">Tonajdan hesapla</button><button data-cmode="area" aria-pressed="' + !ton + '">Yüzey alanı gir</button></div>';
    if (ton) {
      h += '<label class="cf"><span>Çelik miktarı</span><span class="ciw big"><input inputmode="decimal" data-cf="ton" value="' + esc(String(C.ton ?? "")) + '" placeholder="0"><em>ton</em></span></label>' +
        '<div class="flab">Profil tipi (ton başına yüzey)</div><div class="opts">' + STEEL.map(([l, sub, v]) => '<button class="opt" data-hm="' + v + '" aria-pressed="' + (num(C.m2t) === v) + '"><b>' + l + ' · ' + v + ' m²/t</b><small>' + sub + '</small></button>').join("") + '</div>' +
        '<label class="cf" style="margin-top:10px"><span>Ton başına yüzey (elle değiştirilebilir)</span><span class="ciw"><input inputmode="decimal" data-cf="m2t" value="' + esc(String(C.m2t ?? "")) + '" placeholder="20"><em>m²/ton</em></span></label>' +
        '<div class="hres"><span><small>Hesaplanan yüzey alanı</small><b id="harea">' + f(areaOf(), 0) + ' m²</b></span></div>';
    } else {
      h += '<label class="cf"><span>Boyanacak alan</span><span class="ciw big"><input inputmode="decimal" data-cf="area" value="' + esc(String(C.area ?? "")) + '" placeholder="0"><em>m²</em></span></label>';
    }
    h += '</section>';
    h += step(2, "Fire", "Püskürtme kaybı, yüzey pürüzlülüğü, profil şekli");
    h += '<section class="ccard"><label class="cf"><span>Fire oranı</span><span class="ciw big"><input inputmode="decimal" data-cf="loss" value="' + esc(String(C.loss ?? "")) + '" placeholder="30"><em>%</em></span></label>' +
      '<div class="quick">' + [20, 30, 40, 50].map(v => '<button data-lq="' + v + '" aria-pressed="' + (num(C.loss) === v) + '">%' + v + '</button>').join("") + '</div></section>';
    h += step(3, "Katları gir", "Kuru filmi ya da yaş filmi yaz, diğeri otomatik hesaplanır");
    h += C.layers.map((l, i) => '<section class="ccard layer"><div class="chead"><span class="cnum">' + (i + 1) + '</span><input class="cname" data-cl="' + i + '.n" value="' + esc(l.n) + '" aria-label="Kat adı"><button class="cdel" data-cdel="' + i + '" aria-label="Katı sil">' + ic("trash") + '</button></div>' +
      '<div class="cgrid">' + lin(i, "vs", "Hacimce katı madde", l.vs, "%") + lin(i, "coats", "Kat sayısı", l.coats, "kat") + '</div>' +
      '<div class="film">' + lin(i, "dft", "Kuru film (DFT)", l.dft, "µm") + '<span class="link" aria-hidden="true">⇄</span>' + lin(i, "wft", "Yaş film (WFT)", wftOf(l), "µm") + '</div>' +
      '<div class="cgrid one">' + lin(i, "price", "Birim fiyat (isteğe bağlı)", l.price, "$/L") + '</div></section>').join("");
    h += '<button class="cadd" data-cadd="1">' + ic("plus") + 'Kat ekle</button>';
    h += step(4, "Sonuç", "");
    h += '<section class="cres" id="cres" aria-live="polite"></section>';
    h += '<button class="csum" id="csum" data-cgo="1" aria-label="Sonuca git"></button>';
    h += '<p class="foot">Teorik yayılma = katı madde × 10 ÷ DFT · Pratik yayılma = teorik × (1 − fire) · WFT = DFT × 100 ÷ katı madde. Ton başına yüzey profil boyutuna göre değişir; kesin alan için proje metrajını esas al.</p>';
    return h;
  }

  function resultsHTML() {
    const r = calc();
    return '<div class="ctot"><div><small>Toplam boya</small><b>' + f(r.liters, 0) + ' L</b></div><div><small>Toplam DFT</small><b>' + f(r.dft, 0) + ' µm</b></div><div><small>Maliyet</small><b>' + (r.cost ? usd(r.cost) : "–") + '</b></div></div>' +
      '<div class="ctot2">' + (C.mode === "ton" ? '<span>Çelik <b>' + f(num(C.ton), 0) + ' t</b></span>' : '') + '<span>Alan <b>' + f(r.A, 0) + ' m²</b></span><span>Fire <b>%' + f(r.L * 100, 0) + '</b></span>' + (r.cpm ? '<span>m² maliyeti <b>' + usd(r.cpm, 2) + '</b></span>' : '') + '</div>' +
      r.rows.map((x, i) => '<div class="rrow"><div class="rh"><b>' + (i + 1) + '. ' + esc(x.n || "Kat") + '</b><b class="rl">' + f(x.liters, 0) + ' L</b></div><div class="rd"><span>' + x.coats + ' × ' + f(x.dft, 0) + ' µm DFT</span><span>WFT ' + (x.wft || "–") + ' µm</span><span>Pratik ' + f(x.prac, 2) + ' m²/L</span>' + (x.cost ? '<span>' + usd(x.cost) + '</span>' : '') + '</div></div>').join("") +
      '<button class="btn cshare" data-cshare="1">' + ic("share") + 'Sonucu paylaş</button>';
  }
  function shareText() {
    const r = calc();
    return "NEWSPENGUEN · Protective boya hesabı\n" + (C.mode === "ton" ? "Çelik: " + f(num(C.ton), 0) + " ton × " + f(num(C.m2t), 0) + " m²/t = " : "Alan: ") + f(r.A, 0) + " m² · Fire: %" + f(r.L * 100, 0) + "\n" +
      r.rows.map((x, i) => (i + 1) + ". " + (x.n || "Kat") + ": " + x.coats + " × " + f(x.dft, 0) + " µm DFT (WFT " + (x.wft || "–") + " µm, KM %" + f(x.vs, 0) + ") → " + f(x.liters, 0) + " L" + (x.cost ? ", " + usd(x.cost) : "")).join("\n") +
      "\nToplam: " + f(r.liters, 0) + " L · toplam DFT " + f(r.dft, 0) + " µm" + (r.cost ? "\nMaliyet: " + usd(r.cost) + " (" + usd(r.cpm, 2) + "/m²)" : "");
  }
  function sumHTML() { const r = calc(); return '<span>Toplam</span><b>' + f(r.liters, 0) + ' L · ' + f(r.dft, 0) + ' µm' + (r.cost ? ' · ' + usd(r.cost) : '') + '</b>' + ic("chev"); }
  const refresh = () => {
    const el = document.getElementById("cres"); if (el) el.innerHTML = resultsHTML();
    const sm = document.getElementById("csum"); if (sm) sm.innerHTML = sumHTML();
    const ha = document.getElementById("harea"); if (ha) ha.textContent = f(areaOf(), 0) + " m²";
  };
  const setField = (sel, v) => { const e = document.querySelector(sel); if (e && e !== document.activeElement) e.value = v; };
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
    const t = e.target, d = t.dataset || {};
    if (d.cf) {
      C[d.cf] = t.value; save(); refresh();
      if (d.cf === "m2t") document.querySelectorAll("[data-hm]").forEach(b => b.setAttribute("aria-pressed", String(num(b.dataset.hm) === num(t.value))));
      if (d.cf === "loss") document.querySelectorAll("[data-lq]").forEach(b => b.setAttribute("aria-pressed", String(num(b.dataset.lq) === num(t.value))));
    } else if (d.cl) {
      const [i, k] = d.cl.split("."), l = C.layers[+i];
      if (k === "wft") { const w = num(t.value), v = num(l.vs); l.dft = w > 0 && v > 0 ? Math.round(w * v / 100) : ""; setField('[data-cl="' + i + '.dft"]', l.dft); }
      else { l[k] = t.value; if (k === "dft" || k === "vs") setField('[data-cl="' + i + '.wft"]', wftOf(l)); }
      save(); refresh();
    }
  });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-cmode],[data-cadd],[data-cdel],[data-cshare],[data-cgo],[data-hm],[data-lq]");
    if (!b) return;
    const d = b.dataset;
    if (d.cgo) { document.getElementById("cres").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (d.cmode) { if (d.cmode === "area" && C.mode === "ton" && areaOf() > 0) C.area = Math.round(areaOf()); C.mode = d.cmode; }
    else if (d.lq) C.loss = num(d.lq);
    else if (d.cadd) C.layers.push(L3("Kat " + (C.layers.length + 1), "", ""));
    else if (d.cdel) { if (C.layers.length > 1) C.layers.splice(+d.cdel, 1); }
    else if (d.hm) C.m2t = num(d.hm);
    else if (d.cshare) {
      const txt = shareText(), Pl = window.Capacitor && window.Capacitor.Plugins;
      if (Pl && Pl.Share && window.Capacitor.isNativePlatform()) Pl.Share.share({ title: "Boya hesabı", text: txt }).catch(() => {});
      else if (navigator.share) navigator.share({ text: txt }).catch(() => {});
      else try { navigator.clipboard.writeText(txt); b.lastChild.textContent = "Kopyalandı"; } catch (_) {}
      return;
    }
    const y = window.scrollY; save(); render(); window.scrollTo(0, y);
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
  const ABROAD = "Global";
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
  let LOC = new Set(store.get("loc", []).map(c => c === "Yurt dışı" ? ABROAD : c));
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
    h += '<div class="sh-quick"><button class="chip" data-loc="mine" aria-pressed="' + ["İstanbul", "Tekirdağ", "Edirne", "Kırklareli"].every(c => draft.sel.has(c)) + '">★ Bölgem: İstanbul + Trakya</button><button class="chip" data-loc="abroad" aria-pressed="' + draft.sel.has(ABROAD) + '">🌍 Global <span class="n">' + (cnt[ABROAD] || 0) + '</span></button></div>';
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
      $("top").innerHTML = '<div class="bar"><h1 class="pagetitle">Protective Hesap</h1><button class="av" data-view="profile" aria-label="Profil">R</button></div>';
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
          if (sec) sec.insertAdjacentHTML("beforebegin", '<button class="calcpromo" data-view="calc"><span class="cp-i">' + ic("calc") + '</span><span><b>Boya Hesapla</b><small>Protective sarfiyat ve maliyet</small></span>' + ic("chev") + '</button>');
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
