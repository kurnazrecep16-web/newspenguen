/* =========================================================
   COATNEWS · Global Brand Intelligence (uygulama modülü)
   Ekranlar: GBI ana panosu, markalar, marka profili, haber detayı, konu akışı,
   Share of Voice, takip ve bildirim tercihleri.
   Veri: Supabase RPC'leri (bi_dashboard, bi_brand_profile, bi_stories_feed, bi_story, bi_sov).
   Tüm sayılar gerçek kayıtlardan gelir; veri yoksa boş durum gösterilir, örnek veri yoktur.
   ========================================================= */
(function () {
  "use strict";
  const A = window.NPApp;
  if (!A || !A.views) return;
  const V = A.views, S = A.state, { nav, ic, esc, toast } = A.ui;
  const URL0 = A.supa.url, KEY = A.supa.key;
  const en = () => !!(window.NPLang && NPLang.get() === "en");
  const t = (tr, e) => (en() ? e : tr);

  ["gbi", "gbiBrands", "gbiBrand", "gbiStory", "gbiTopic", "gbiSov", "gbiFollow"].forEach(n => { A.tabOf[n] = "more"; });

  /* ---------- Sözlükler ---------- */
  const SEG = {
    marine: ["Marine", "Marine", "--seg-marine"], protective: ["Protective", "Protective", "--seg-prot"],
    powder: ["Toz Boya", "Powder", "--seg-powder"], decorative: ["Dekoratif", "Decorative", "--seg-deco"], energy: ["Enerji", "Energy", "--seg-energy"]
  };
  const segName = k => (SEG[k] ? (en() ? SEG[k][1] : SEG[k][0]) : k);
  const segTag = k => '<span class="tag soft" style="--c:var(' + (SEG[k] ? SEG[k][2] : "--np-blue-500") + ')">' + esc(segName(k)) + '</span>';
  const TOPIC = {
    A: ["Yatırım", "Investment"], B: ["Fabrika / kapasite", "Factory / capacity"], C: ["Yeni ürün", "Product launch"], D: ["Teknoloji", "Technology"],
    E: ["Satın alma / birleşme", "Acquisition / merger"], F: ["Ortaklık / distribütör", "Partnership / distribution"], G: ["Proje", "Project"],
    H: ["Marine projesi", "Marine project"], I: ["Protective proje", "Protective project"], J: ["Toz boya gelişmesi", "Powder development"],
    K: ["Dekoratif gelişme", "Decorative development"], L: ["Enerji", "Energy"], M: ["Sürdürülebilirlik", "Sustainability"],
    N: ["Finans / kurumsal", "Financial / corporate"], O: ["Dolaylı geçiş", "Incidental mention"]
  };
  const topicName = c => (TOPIC[c] ? TOPIC[c][en() ? 1 : 0] : c);
  const BIZ = ["A", "B", "E", "F", "D", "C", "G"];
  const TYPE = { manufacturer: ["Üretici", "Manufacturer"], corporate_group: ["Kurumsal grup", "Corporate group"], consumer_brand: ["Tüketici markası", "Consumer brand"], product_brand: ["Ürün markası", "Product brand"] };
  const typeName = k => (TYPE[k] ? TYPE[k][en() ? 1 : 0] : k);
  const CTYPE = { press_release: ["Basın bülteni", "Press release"], sponsored: ["Sponsorlu", "Sponsored"], opinion: ["Görüş", "Opinion"] };
  const COUNTRY = { TR: "Türkiye", DE: "Almanya", NO: "Norveç", DK: "Danimarka", NL: "Hollanda", US: "ABD", GB: "Birleşik Krallık", CN: "Çin", JP: "Japonya", IN: "Hindistan", KR: "Güney Kore", FR: "Fransa", IT: "İtalya", ES: "İspanya", PL: "Polonya", BR: "Brezilya", PT: "Portekiz", FI: "Finlandiya", SE: "İsveç", CH: "İsviçre", SA: "Suudi Arabistan", AE: "BAE", EG: "Mısır", AU: "Avustralya", SG: "Singapur", VN: "Vietnam", ID: "Endonezya", TH: "Tayland", MY: "Malezya", MX: "Meksika", GR: "Yunanistan", RO: "Romanya", BG: "Bulgaristan", QA: "Katar", NZ: "Yeni Zelanda", SI: "Slovenya" };
  const countryName = c => { if (!c) return ""; if (en()) { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c) || c; } catch (e) { return c; } } return COUNTRY[c] || c; };
  const fdate = s => { if (!s) return ""; const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString(en() ? "en-GB" : "tr-TR", { day: "numeric", month: "short", year: "numeric" }); };
  const nf = n => Number(n || 0).toLocaleString(en() ? "en-US" : "tr-TR");

  /* ---------- API ---------- */
  const G = { cache: {}, at: {}, pending: {}, err: {}, days: 30, sov: { ids: [], days: 90 }, follows: null, brandIndex: null };
  const token = () => (S.session && S.session.access_token) || null;
  const uid = () => { const tk = token(); if (!tk) return null; try { return JSON.parse(atob(tk.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || null; } catch (e) { return null; } };
  async function call(path, opt = {}) {
    const h = { apikey: KEY, "Content-Type": "application/json", Accept: "application/json" };
    const tk = token(); if (tk) h.Authorization = "Bearer " + tk;
    if (opt.prefer) h.Prefer = opt.prefer;
    const r = await fetch(URL0 + "/rest/v1/" + path, { method: opt.method || "GET", headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined });
    const txt = await r.text();
    let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
    if (!r.ok) { const e = new Error((j && (j.message || j.msg)) || ("HTTP " + r.status)); e.status = r.status; e.code = j && j.code; throw e; }
    return j;
  }
  const rpc = (fn, args) => call("rpc/" + fn, { method: "POST", body: args || {} });
  /** Önbellekli yükleme: veri gelene kadar undefined döner, gelince ekran yeniden çizilir. */
  const TTL = 5 * 60_000;
  function use(key, loader) {
    if (key in G.cache && !G.pending[key] && Date.now() - (G.at[key] || 0) > (G.cache[key] === null ? 30_000 : TTL)) { delete G.cache[key]; }
    if (key in G.cache) return G.cache[key];
    if (!G.pending[key]) {
      G.pending[key] = loader().then(v => { G.cache[key] = v; G.at[key] = Date.now(); delete G.err[key]; })
        .catch(e => { G.err[key] = e; G.cache[key] = null; G.at[key] = Date.now(); })
        .finally(() => { delete G.pending[key]; if (String(A.cur().name).startsWith("gbi")) A.rerender(); });
    }
    return undefined;
  }
  const notReady = k => { const e = G.err[k]; return e && (e.status === 404 || e.code === "PGRST202" || e.code === "42P01" || e.code === "PGRST205"); };
  const loading = () => '<div class="gbi-skel"><i></i><i></i><i></i></div>';
  const inactive = () => '<section class="qcard gbi-note"><h3>' + t("Brand Intelligence henüz etkin değil", "Brand Intelligence is not active yet") + '</h3><p>' +
    t("Marka izleme veritabanı kurulduğunda ve ilk taramalar tamamlandığında haberler ve istatistikler burada görünecek. Bu ekranda örnek veya tahmini veri gösterilmez.",
      "News and statistics will appear here once the brand monitoring database is set up and the first scans finish. No sample or estimated data is shown on this screen.") + '</p></section>';
  const failed = k => notReady(k) ? inactive() : '<section class="qcard gbi-note"><h3>' + t("Veri alınamadı", "Could not load data") + '</h3><p>' + esc(G.err[k] && G.err[k].message) + '</p><button class="btn secondary" data-gbi="retry" data-k="' + esc(k) + '">' + t("Tekrar dene", "Retry") + '</button></section>';
  const empty = s => '<p class="gbi-empty">' + s + '</p>';
  function state(key, loader, ok) {
    const v = use(key, loader);
    if (v === undefined) return loading();
    if (v === null) return failed(key);
    return ok(v);
  }

  const CHART = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';

  /* ---------- Bileşenler ---------- */
  const nav2 = (title, right) => nav(title, right || "");
  const coverage = () => '<details class="gbi-cov"><summary>' + ic("info", "ic xs") + t("Kapsam ve sınırlamalar", "Coverage and limitations") + '</summary><p>' +
    t("Sayılar yalnızca COATNEWS'in izlediği kaynaklardan (GDELT, sektör ve şirket RSS beslemeleri; anahtar tanımlıysa haber API'leri) toplanıp editör onayıyla yayımlanan haberlerden hesaplanır. Dünyada yayımlanan tüm haberleri kapsamaz; kaynak listesi genişledikçe sayılar değişir. Share of Voice pazar payı değildir.",
      "Figures are calculated only from stories collected from the sources COATNEWS monitors (GDELT, industry and company RSS feeds, and news APIs where configured) and published after editorial review. They do not cover every story published worldwide and change as sources are added. Share of Voice is not market share.") + '</p></details>';
  const stat = (n, l) => '<div class="gbi-stat"><b>' + nf(n) + '</b><small>' + l + '</small></div>';
  function bars(list, label, value, go) {
    const max = Math.max(1, ...list.map(value));
    return '<div class="rows gbi-bars">' + list.map(x => '<button class="row"' + (go ? ' ' + go(x) : '') + '><span class="rt"><b>' + esc(label(x)) + '</b><span class="gbi-bar"><i style="width:' + Math.max(3, Math.round(100 * value(x) / max)) + '%"></i></span></span><span class="cnt">' + nf(value(x)) + '</span>' + (go ? ic("chev", "ic sm chev") : '') + '</button>').join("") + '</div>';
  }
  /** Eksik haftaları 0 ile doldurur; en az 12 hafta gösterir (seyrek veride barlar dev görünmesin). */
  const WK = 7 * 864e5;
  const monday = d => { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.getTime(); };
  function weekRange(weeks, min = 12) {
    const end = monday(Date.now()), first = weeks.length ? Math.min(...weeks.map(w => Date.parse(w))) : end;
    const start = Math.min(first, end - (min - 1) * WK), out = [];
    for (let x = start; x <= end; x += WK) out.push(new Date(x).toISOString().slice(0, 10));
    return out;
  }
  function weekly(rows0, h = 64) {
    if (!rows0.length) return empty(t("Bu dönemde yayımlanmış haber yok.", "No published stories in this period."));
    const rows = weekRange(rows0.map(r => r.week)).map(w => ({ week: w, n: (rows0.find(r => r.week === w) || { n: 0 }).n }));
    const max = Math.max(1, ...rows.map(r => r.n)), w = 100 / rows.length;
    return '<svg class="gbi-chart" viewBox="0 0 100 ' + h + '" preserveAspectRatio="none" role="img" aria-label="' + t("Haftalık haber sayısı", "Stories per week") + '">' +
      rows.map((r, i) => { const bh = r.n ? Math.max(1.5, (h - 4) * r.n / max) : 0.6; return '<rect x="' + (i * w + w * 0.15).toFixed(2) + '" y="' + (h - bh).toFixed(2) + '" width="' + (w * 0.7).toFixed(2) + '" height="' + bh.toFixed(2) + '" rx="1"><title>' + fdate(r.week) + ': ' + r.n + '</title></rect>'; }).join("") + '</svg>' +
      '<div class="gbi-axis"><span>' + fdate(rows[0].week) + '</span><span>' + fdate(rows[rows.length - 1].week) + '</span></div>';
  }
  function scard(s) {
    const badge = s.content_type && CTYPE[s.content_type] ? '<span class="tag soft" style="--c:var(--np-amber-400)">' + CTYPE[s.content_type][en() ? 1 : 0] + '</span>' : '';
    return '<button class="gbi-card" data-gbi="story" data-id="' + esc(s.id) + '">' +
      '<span class="gbi-meta">' + (s.main ? '<b>' + esc(s.main.name) + '</b>' : '') + '<span>' + esc(s.publisher || s.domain || "") + '</span><span>' + fdate(s.first_published_at) + '</span></span>' +
      '<h3>' + esc(s.title) + '</h3>' +
      '<span class="gbi-tags">' + (s.segments || []).map(segTag).join("") + ((s.topics || []).includes("O") ? '<span class="tag soft" style="--c:var(--np-grey-500)">' + esc(topicName("O")) + '</span>' : (s.topics || []).slice(0, 2).map(c => '<span class="tag soft" style="--c:var(--np-blue-500)">' + esc(topicName(c)) + '</span>').join("")) + badge +
      (s.source_count > 1 ? '<span class="gbi-src">' + ic("layers", "ic xs") + s.source_count + ' ' + t("kaynak", "sources") + '</span>' : '') + '</span></button>';
  }
  const feed = list => (list.length ? '<div class="gbi-list">' + list.map(scard).join("") + '</div>' : empty(t("Henüz yayımlanmış haber yok.", "No published stories yet.")));
  const periodSeg = (cur, attr) => '<div class="seg" role="group" aria-label="' + t("Dönem", "Period") + '">' + [[30, t("30 gün", "30 days")], [90, t("90 gün", "90 days")], [365, t("1 yıl", "1 year")]].map(([d, l]) => '<button data-gbi="' + attr + '" data-d="' + d + '" aria-pressed="' + (cur === d) + '">' + l + '</button>').join("") + '</div>';

  /* ---------- Ana pano ---------- */
  V.gbi = () => {
    const k = "dash:" + G.days;
    return nav2("Brand Intelligence") + '<main class="wrap gbi">' +
      '<p class="lead" style="margin:0 0 12px">' + t("Boya ve kaplama markalarının dünya genelindeki haber görünürlüğü.", "News visibility of paint and coatings brands worldwide.") + '</p>' +
      '<div class="gbi-quick"><button data-gbi="brands">' + ic("layers") + '<b>' + t("Markalar", "Brands") + '</b></button><button data-gbi="sov">' + CHART + '<b>Share of Voice</b></button><button data-gbi="follow">' + ic("bell") + '<b>' + t("Takip", "Following") + '</b></button></div>' +
      periodSeg(G.days, "days") +
      state(k, () => rpc("bi_dashboard", { p_days: G.days }), d => {
        const o = d.overview || {}, bt = d.by_topic || {};
        return '<div class="gbi-stats">' + stat(o.monitored_brands, t("izlenen marka", "brands monitored")) + stat(o.stories_published, t("yayımlanan haber", "published stories")) +
          stat(o.countries, t("ülke", "countries")) + stat((o.active_providers || 0) + (o.active_feeds || 0), t("etkin kaynak", "active sources")) + stat(o.segments, t("segment", "segments")) + '</div>' + coverage() +
          '<div class="h-sec"><h2>' + t("En çok anılan markalar", "Most mentioned brands") + '</h2></div>' +
          (d.top_brands.length ? bars(d.top_brands, x => x.name, x => x.mentions, x => 'data-gbi="brand" data-slug="' + esc(x.slug) + '"') : empty(t("Bu dönemde marka geçişi yok.", "No brand mentions in this period."))) +
          (d.rising.length ? '<div class="h-sec"><h2>' + t("En hızlı yükselenler", "Fastest growing") + '</h2></div><div class="rows">' + d.rising.map(x => '<button class="row" data-gbi="brand" data-slug="' + esc(x.slug) + '"><span class="rt"><b>' + esc(x.name) + '</b><small>' + t("önceki dönem", "previous period") + ' ' + x.prev + ' → ' + x.mentions + '</small></span><span class="cnt gbi-up">+' + (x.mentions - x.prev) + '</span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>' : '') +
          '<div class="h-sec"><h2>' + t("İş istihbaratı", "Business intelligence") + '</h2></div><div class="gbi-biz">' +
          BIZ.map(c => '<button data-gbi="topic" data-t="' + c + '"><b>' + nf(bt[c] || 0) + '</b><small>' + esc(topicName(c)) + '</small></button>').join("") + '</div>' +
          '<div class="h-sec"><h2>' + t("Haftalık aktivite", "Weekly activity") + '</h2></div><div class="card">' + weekly(d.weekly) + '</div>' +
          (d.by_segment.length ? '<div class="h-sec"><h2>' + t("Segmentler", "Segments") + '</h2></div>' + bars(d.by_segment, x => segName(x.segment), x => x.n) : '') +
          (d.by_country.length ? '<div class="h-sec"><h2>' + t("Ülkeler", "Countries") + '</h2></div>' + bars(d.by_country, x => countryName(x.country), x => x.n) : '');
      }) +
      '<div class="h-sec"><h2>' + t("Son haberler", "Latest stories") + '</h2></div>' +
      state("feed:latest", () => rpc("bi_stories_feed", { p_limit: 15 }), feed) + '</main>';
  };

  /* ---------- Markalar ---------- */
  V.gbiBrands = p => {
    const q = (p.q || "").toLocaleLowerCase("tr"), seg = p.seg || "all";
    return nav2(t("Markalar", "Brands")) + '<main class="wrap gbi"><label class="search">' + ic("search") + '<input type="search" data-gbiq="1" placeholder="' + t("Marka ara", "Search brands") + '" value="' + esc(p.q || "") + '" aria-label="' + t("Marka ara", "Search brands") + '"></label>' +
      '<div class="chips" style="margin:12px calc(-1 * var(--gutter)) 12px">' + ["all", ...Object.keys(SEG)].map(k => '<button class="chip" data-gbi="bseg" data-s="' + k + '" aria-pressed="' + (seg === k) + '">' + (k === "all" ? t("Tümü", "All") : esc(segName(k))) + '</button>').join("") + '</div>' +
      state("brands", () => call("bi_entities?select=id,slug,name,entity_type,country_iso2,segments,article_count,parent_id&order=priority.asc,name.asc"), list => {
        G.brandIndex = list;
        const f = list.filter(b => (!q || b.name.toLocaleLowerCase("tr").includes(q)) && (seg === "all" || (b.segments || []).includes(seg)));
        if (!f.length) return empty(t("Eşleşen marka yok.", "No matching brands."));
        return '<div class="rows">' + f.map(b => '<button class="row" data-gbi="brand" data-slug="' + esc(b.slug) + '"><span class="rt"><b>' + esc(b.name) + '</b><small>' + esc(typeName(b.entity_type)) + (b.country_iso2 ? ' · ' + esc(countryName(b.country_iso2)) : '') + '</small></span><span class="cnt">' + nf(b.article_count) + '</span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>' +
          '<p class="hint" style="margin-top:10px">' + t("Sağdaki sayı, markanın geçtiği toplanmış haber sayısıdır (onay bekleyenler dahil).", "The number is how many collected stories mention the brand (including ones awaiting review).") + '</p>';
      }) + '</main>';
  };

  /* ---------- Marka profili ---------- */
  const isFollowing = (kind, ref) => !!(G.follows && G.follows.some(f => f.kind === kind && f.ref === ref));
  V.gbiBrand = p => {
    const k = "brand:" + p.slug;
    const b = use(k, () => rpc("bi_brand_profile", { p_slug: p.slug }));
    if (b === undefined) return nav2("") + '<main class="wrap">' + loading() + '</main>';
    if (b === null) return nav2(t("Marka", "Brand")) + '<main class="wrap">' + failed(k) + '</main>';
    {
      if (!b.entity) return nav2(t("Marka", "Brand")) + '<main class="wrap">' + empty(t("Marka bulunamadı.", "Brand not found.")) + '</main>';
      const e = b.entity, fol = isFollowing("entity", e.id), tp = b.topics || {};
      const tab = p.t || "all";
      const tabs = [["all", t("Tümü", "All"), null], ["inv", t("Yatırım", "Investment"), "A"], ["exp", t("Fabrika", "Factory"), "B"], ["prod", t("Ürün", "Products"), "C"], ["part", t("Ortaklık", "Partnerships"), "F"], ["proj", t("Proje", "Projects"), "G"], ["acq", t("Satın alma", "M&A"), "E"]];
      const topic = (tabs.find(x => x[0] === tab) || tabs[0])[2];
      if (e.id && token()) loadFollows();
      return nav2(e.name) + '<main class="wrap gbi">' +
        '<section class="gbi-brand"><div><small>' + esc(typeName(e.entity_type)) + (e.country_iso2 ? ' · ' + esc(countryName(e.country_iso2)) : '') + '</small>' +
        (b.parent ? '<button class="gbi-link" data-gbi="brand" data-slug="' + esc(b.parent.slug) + '">' + t("Ana şirket", "Parent") + ': ' + esc(b.parent.name) + '</button>' : (e.parent_note ? '<small>' + esc(e.parent_note) + '</small>' : '')) +
        (e.website ? '<a class="gbi-link" href="' + esc(e.website) + '" target="_blank" rel="noopener">' + ic("ext", "ic xs") + esc(e.website.replace(/^https?:\/\/(www\.)?/, "")) + '</a>' : '') + '</div>' +
        '<button class="btn ' + (fol ? "secondary" : "") + '" data-gbi="followEntity" data-id="' + esc(e.id) + '" aria-pressed="' + fol + '">' + ic(fol ? "check" : "plus", "ic sm") + (fol ? t("Takip ediliyor", "Following") : t("Takip et", "Follow")) + '</button></section>' +
        '<div class="gbi-tags" style="margin:12px 0">' + (e.segments || []).map(segTag).join("") + '</div>' +
        ((e.product_families || []).length ? '<p class="hint">' + t("Ürün aileleri", "Product families") + ': ' + e.product_families.map(esc).join(", ") + '</p>' : '') +
        '<div class="gbi-stats two">' + stat(b.total, t("haber (12 ay)", "stories (12 mo)")) + stat((b.countries || []).length, t("ülke", "countries")) + stat((tp.A || 0) + (tp.B || 0), t("yatırım / fabrika", "investment / factory")) + stat(tp.C || 0, t("ürün lansmanı", "launches")) + '</div>' +
        '<div class="h-sec"><h2>' + t("Haber zaman çizelgesi", "Mention timeline") + '</h2></div><div class="card">' + weekly(b.weekly || []) + '</div>' +
        ((b.countries || []).length ? '<div class="h-sec"><h2>' + t("Ülke bazında", "By country") + '</h2></div>' + bars(b.countries.slice(0, 8), x => countryName(x.country), x => x.n) : '') +
        ((b.children || []).length ? '<div class="h-sec"><h2>' + t("Markaları", "Brands") + '</h2></div><div class="rows">' + b.children.map(c => '<button class="row" data-gbi="brand" data-slug="' + esc(c.slug) + '"><span class="rt"><b>' + esc(c.name) + '</b><small>' + esc(typeName(c.type)) + '</small></span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>' : '') +
        '<div class="h-sec"><h2>' + t("Haberler", "Stories") + '</h2></div>' +
        '<div class="chips" style="margin:0 calc(-1 * var(--gutter)) 12px">' + tabs.map(([kk, l, c]) => '<button class="chip" data-gbi="btab" data-t="' + kk + '" aria-pressed="' + (tab === kk) + '">' + l + (c ? ' <span class="n">' + (tp[c] || 0) + '</span>' : '') + '</button>').join("") + '</div>' +
        state("bfeed:" + e.id + ":" + (topic || ""), () => rpc("bi_stories_feed", { p_limit: 30, p_entity: e.id, p_topic: topic }), feed) +
        '<p class="hint" style="margin-top:14px">' + t("Logo yalnızca marka sahibi izin verdiğinde gösterilir.", "Logos are shown only where the brand owner has authorised it.") + '</p></main>';
    }
  };

  /* ---------- Haber detayı ---------- */
  V.gbiStory = p => {
    const k = "story:" + p.id;
    const v = use(k, () => rpc("bi_story", { p_id: p.id }));
    if (v === undefined) return nav2("") + '<main class="wrap">' + loading() + '</main>';
    if (v === null || !v.story) return nav2("") + '<main class="wrap">' + (v === null ? failed(k) : empty(t("Haber bulunamadı veya yayından kaldırıldı.", "Story not found or no longer published."))) + '</main>';
    const s = v.story, src = v.sources || [], pri = src.find(x => x.primary) || src[0];
    const ct = CTYPE[s.content_type];
    return nav2(t("Haber", "Story"), pri ? '<button class="iconbtn" data-gbi="share" data-u="' + esc(pri.url) + '" data-t="' + esc(s.headline_override || s.title) + '" aria-label="' + t("Paylaş", "Share") + '">' + ic("share") + '</button>' : "") +
      '<main class="wrap gbi"><article class="gbi-story">' +
      '<div class="gbi-tags">' + (s.segments || []).map(segTag).join("") + (ct ? '<span class="tag soft" style="--c:var(--np-amber-400)">' + ct[en() ? 1 : 0] + '</span>' : '') + '</div>' +
      '<h1>' + esc(s.headline_override || s.title) + '</h1>' +
      '<p class="gbi-meta">' + (pri ? '<b>' + esc(pri.publisher || pri.domain) + '</b>' : '') + '<span>' + fdate(s.first_published_at) + '</span>' + (s.country_iso2 ? '<span>' + esc(countryName(s.country_iso2)) + '</span>' : '') + '</p>' +
      (s.summary ? '<section class="gbi-sum"><small>' + (s.summary_is_ai ? t("COATNEWS özeti · yapay zekâ ile hazırlandı, editör onaylı", "COATNEWS summary · AI-assisted, editor approved") : t("COATNEWS özeti", "COATNEWS summary")) + '</small><p>' + esc(s.summary) + '</p></section>'
        : (pri && pri.description ? '<section class="gbi-sum"><small>' + t("Kaynağın kısa açıklaması", "Short description from the source") + ' · ' + esc(pri.publisher || pri.domain) + '</small><p>' + esc(pri.description) + '</p></section>' : '')) +
      (pri ? '<a class="btn" href="' + esc(pri.url) + '" target="_blank" rel="noopener">' + ic("ext", "ic sm") + t("Orijinal haberi oku", "Read the original story") + '</a>' : '') +
      ((v.brands || []).length ? '<div class="h-sec"><h2>' + t("Markalar", "Brands") + '</h2></div><div class="rows">' + v.brands.filter(b => b.role !== "parent").map(b => '<button class="row" data-gbi="brand" data-slug="' + esc(b.slug) + '"><span class="rt"><b>' + esc(b.name) + '</b><small>' + (b.role === "main" ? t("Ana konu", "Main subject") : t("Haberde geçiyor", "Mentioned")) + '</small></span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>' : '') +
      ((s.topics || []).length ? '<div class="h-sec"><h2>' + t("Konular", "Topics") + '</h2></div><div class="gbi-tags">' + s.topics.map(c => '<button class="tag soft" style="--c:var(--np-blue-500)" data-gbi="topic" data-t="' + c + '">' + esc(topicName(c)) + '</button>').join("") + '</div>' : '') +
      '<div class="h-sec"><h2>' + (src.length > 1 ? t("Kaynaklar", "Sources") + ' (' + src.length + ')' : t("Kaynak", "Source")) + '</h2></div><div class="rows">' +
      src.map(x => '<a class="row" href="' + esc(x.url) + '" target="_blank" rel="noopener"><span class="rt"><b>' + esc(x.publisher || x.domain) + (x.primary ? ' · ' + t("birincil", "primary") : '') + '</b><small>' + fdate(x.published_at) + ' · ' + esc(x.title) + '</small></span>' + ic("ext", "ic sm chev") + '</a>').join("") + '</div>' +
      '<p class="hint" style="margin-top:12px">' + t("Haberin hakları yayıncısına aittir. COATNEWS yalnızca başlık, kısa açıklama ve bağlantıyı gösterir.", "Rights belong to the publisher. COATNEWS shows only the headline, a short description and the link.") + '</p></article></main>';
  };

  /* ---------- Konu akışı ---------- */
  V.gbiTopic = p => nav2(topicName(p.t)) + '<main class="wrap gbi">' + state("topic:" + p.t, () => rpc("bi_stories_feed", { p_limit: 50, p_topic: p.t }), feed) + '</main>';

  /* ---------- Share of Voice ---------- */
  const PAL = ["#0066FF", "#FF7A00", "#00A58C", "#7B61FF"];
  V.gbiSov = () => {
    const ids = G.sov.ids, k = "sov:" + ids.join(",") + ":" + G.sov.days;
    const brandList = use("brands", () => call("bi_entities?select=id,slug,name,entity_type,country_iso2,segments,article_count,parent_id&order=priority.asc,name.asc"));
    if (brandList) G.brandIndex = brandList;
    const name = id => ((G.brandIndex || []).find(b => b.id === id) || {}).name || "—";
    let h = nav2("Share of Voice") + '<main class="wrap gbi"><p class="lead" style="margin:0 0 12px">' + t("Seçtiğin markaların izlenen haberlerdeki görünürlük payı. Pazar payı veya ciro payı değildir.", "Share of monitored news mentions for the brands you pick. Not market share or revenue share.") + '</p>' +
      '<div class="gbi-pick">' + ids.map((id, i) => '<button class="chip" aria-pressed="true" style="background:' + PAL[i] + ';border-color:' + PAL[i] + '" data-gbi="sovDel" data-id="' + esc(id) + '">' + esc(name(id)) + ' ' + ic("x", "ic xs") + '</button>').join("") +
      (ids.length < 4 ? '<button class="chip" data-gbi="sovAdd">' + ic("plus", "ic xs") + t("Marka ekle", "Add brand") + '</button>' : '') + '</div>' +
      '<div class="gbi-presets">' + [["jotun", "hempel"], ["ppg", "akzonobel"], ["dyo", "polisan-kansai"], ["sherwin-williams", "nippon-paint"]].map(pr => '<button data-gbi="sovPreset" data-s="' + pr.join(",") + '">' + pr.map(s => esc(((G.brandIndex || []).find(b => b.slug === s) || { name: s }).name)).join(" vs ") + '</button>').join("") + '</div>' +
      periodSeg(G.sov.days, "sovDays");
    if (ids.length < 2) return h + empty(t("Karşılaştırmak için en az iki marka seç.", "Pick at least two brands to compare.")) + coverage() + '</main>';
    h += state(k, () => rpc("bi_sov", { p_entities: ids, p_days: G.sov.days }), d => {
      const col = id => PAL[ids.indexOf(id)] || "#999";
      const tot = (d.brands || []).reduce((a, b) => a + Number(b.mentions), 0);
      if (!tot) return empty(t("Bu dönemde seçili markalar için yayımlanmış haber yok.", "No published stories for these brands in this period.")) + coverage();
      const stack = '<div class="gbi-stack">' + d.brands.map(b => '<i style="width:' + b.share + '%;background:' + col(b.id) + '" title="' + esc(b.name) + '"></i>').join("") + '</div>';
      const legend = '<div class="rows">' + d.brands.map(b => '<button class="row" data-gbi="brand" data-slug="' + esc(b.slug) + '"><span class="gbi-dot" style="background:' + col(b.id) + '"></span><span class="rt"><b>' + esc(b.name) + '</b><small>' + nf(b.mentions) + ' ' + t("haber", "stories") + '</small></span><span class="cnt">%' + String(b.share).replace(".", en() ? "." : ",") + '</span></button>').join("") + '</div>';
      // Haftalık eğilim (çizgi)
      const weeks = weekRange([...new Set((d.weekly || []).map(w => w.week))], 8);
      let trend = '';
      if (weeks.length > 1) {
        const max = Math.max(1, ...d.weekly.map(w => w.n)), W = 100, H = 60;
        trend = '<div class="h-sec"><h2>' + t("Haftalık eğilim", "Weekly trend") + '</h2></div><div class="card"><svg class="gbi-line" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + t("Haftalık eğilim", "Weekly trend") + '">' +
          ids.map(id => '<polyline fill="none" stroke="' + col(id) + '" stroke-width="1.6" vector-effect="non-scaling-stroke" points="' + weeks.map((w, i) => { const r = d.weekly.find(x => x.week === w && x.id === id); return (i * W / (weeks.length - 1)).toFixed(1) + "," + (H - 3 - (H - 6) * (r ? r.n : 0) / max).toFixed(1); }).join(" ") + '"/>').join("") +
          '</svg><div class="gbi-axis"><span>' + fdate(weeks[0]) + '</span><span>' + fdate(weeks[weeks.length - 1]) + '</span></div></div>';
      }
      const table = (rows, key, label) => {
        const keys = [...new Set(rows.map(r => r[key]))];
        if (!keys.length) return '';
        const sum = kk => rows.filter(r => r[key] === kk).reduce((a, r) => a + r.n, 0);
        keys.sort((a, b) => sum(b) - sum(a));
        return '<div class="gbi-table"><div class="th"><span></span>' + ids.map(id => '<span style="color:' + col(id) + '">' + esc(name(id)) + '</span>').join("") + '</div>' +
          keys.slice(0, 10).map(kk => '<div><span>' + esc(label(kk)) + '</span>' + ids.map(id => { const r = rows.find(x => x[key] === kk && x.id === id); return '<span>' + (r ? r.n : 0) + '</span>'; }).join("") + '</div>').join("") + '</div>';
      };
      return stack + legend + trend +
        '<div class="h-sec"><h2>' + t("Segment bazında", "By segment") + '</h2></div>' + table(d.segments || [], "segment", segName) +
        '<div class="h-sec"><h2>' + t("Ülke bazında", "By country") + '</h2></div>' + table(d.countries || [], "country", countryName) +
        '<div class="h-sec"><h2>' + t("İş konuları", "Business topics") + '</h2></div>' + table((d.topics || []).filter(x => x.topic !== "O"), "topic", topicName) +
        '<p class="hint" style="margin-top:12px">' + t("Kural", "Rule") + ': ' + t("yayımlanmış COATNEWS haberleri, dolaylı geçişler hariç, ana şirket rolü sayılmaz. Tüm markalar aynı kaynak evreni ve aynı kurallarla sayılır.", "published COATNEWS stories, incidental mentions excluded, parent-company role not counted. All brands are counted over the same source universe with the same rules.") + '</p>' + coverage();
    });
    return h + '</main>';
  };

  /* ---------- Takip ve bildirimler ---------- */
  async function loadFollows(force) {
    if (!token() || (G.follows && !force) || G.followsLoading) return;
    G.followsLoading = true;
    try { G.follows = await call("bi_follows?select=kind,ref"); } catch (e) { G.follows = []; G.followErr = e; }
    G.followsLoading = false;
    if (String(A.cur().name).startsWith("gbi")) A.rerender();
  }
  async function toggleFollow(kind, ref) {
    if (!token()) { toast(t("Takip için giriş yap", "Sign in to follow")); return A.go("login"); }
    const me = uid(), on = isFollowing(kind, ref);
    try {
      if (on) await call("bi_follows?user_id=eq." + me + "&kind=eq." + kind + "&ref=eq." + encodeURIComponent(ref), { method: "DELETE" });
      else await call("bi_follows", { method: "POST", body: { user_id: me, kind, ref }, prefer: "resolution=ignore-duplicates" });
      G.follows = on ? G.follows.filter(f => !(f.kind === kind && f.ref === ref)) : [...(G.follows || []), { kind, ref }];
      toast(on ? t("Takipten çıkarıldı", "Unfollowed") : t("Takip ediliyor", "Following"));
    } catch (e) { toast(e.status === 401 ? t("Oturum süresi doldu, yeniden giriş yap", "Session expired, sign in again") : notReady0(e) ? t("Brand Intelligence henüz etkin değil", "Brand Intelligence is not active yet") : e.message); }
    A.rerender();
  }
  const notReady0 = e => e && (e.status === 404 || e.code === "42P01" || e.code === "PGRST205");

  V.gbiFollow = () => {
    let h = nav2(t("Takip ve bildirimler", "Following and alerts")) + '<main class="wrap gbi">';
    if (!token()) return h + '<section class="qcard gbi-note"><h3>' + t("Giriş gerekli", "Sign-in required") + '</h3><p>' + t("Marka, segment, ülke ve konu takibi hesabına kaydedilir.", "Brand, segment, country and topic follows are saved to your account.") + '</p><button class="btn" data-gbi="login">' + t("Giriş yap", "Sign in") + '</button></section></main>';
    const cp = A.cur().p;
    if (!cp._fresh) { cp._fresh = 1; delete G.cache.notifs; delete G.cache.prefs; }   // her girişte uyarılar yeniden okunur
    loadFollows();
    if (!G.follows) return h + loading() + '</main>';
    if (G.followErr && notReady0(G.followErr)) return h + inactive() + '</main>';
    const ents = G.follows.filter(f => f.kind === "entity");
    const idx = G.brandIndex || use("brands", () => call("bi_entities?select=id,slug,name,entity_type,country_iso2,segments,article_count,parent_id&order=priority.asc,name.asc")) || [];
    const bname = id => (idx.find(b => b.id === id) || {}).name || id.slice(0, 8);
    const bslug = id => (idx.find(b => b.id === id) || {}).slug || "";
    const sw = (kind, ref, label, sub) => '<label class="row"><span class="rt"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><input type="checkbox" class="switch" data-gbif="' + kind + '" data-ref="' + esc(ref) + '"' + (isFollowing(kind, ref) ? " checked" : "") + '></label>';
    h += '<div class="h-sec"><h2>' + t("Markalar", "Brands") + '</h2><button class="more" data-gbi="brands">' + t("Marka ekle", "Add brand") + ' ' + ic("chev", "ic xs") + '</button></div>' +
      (ents.length ? '<div class="rows">' + ents.map(f => '<div class="row"><button class="rt" data-gbi="brand" data-slug="' + esc(bslug(f.ref)) + '" style="text-align:left"><b>' + esc(bname(f.ref)) + '</b></button><button class="iconbtn" data-gbi="unfollow" data-id="' + esc(f.ref) + '" aria-label="' + t("Takipten çıkar", "Unfollow") + '">' + ic("x") + '</button></div>').join("") + '</div>' : empty(t("Henüz marka takip etmiyorsun.", "You are not following any brands yet."))) +
      '<div class="h-sec"><h2>' + t("Segmentler", "Segments") + '</h2></div><div class="rows">' + Object.keys(SEG).map(k => sw("segment", k, esc(segName(k)))).join("") + '</div>' +
      '<div class="h-sec"><h2>' + t("Haber türleri", "Story types") + '</h2></div><div class="rows">' + [["A", t("Yatırım duyuruları", "Investment announcements")], ["B", t("Fabrika ve kapasite", "Factories and capacity")], ["C", t("Yeni ürün lansmanları", "New product launches")], ["G", t("Büyük proje duyuruları", "Major project announcements")], ["E", t("Satın alma ve birleşmeler", "Acquisitions and mergers")]].map(([c, l]) => sw("topic", c, l)).join("") + '</div>' +
      '<div class="h-sec"><h2>' + t("Ülkeler", "Countries") + '</h2></div><div class="rows">' + ["TR", "DE", "US", "CN", "IN", "AE", "SA", "EG"].map(c => sw("country", c, esc(countryName(c)))).join("") + '</div>' +
      '<div class="h-sec"><h2>' + t("Bildirim kuralları", "Alert rules") + '</h2></div>' +
      state("prefs", () => call("bi_notification_prefs?select=enabled,min_score,max_per_day"), pr => {
        const p0 = pr[0] || { enabled: true, min_score: 75, max_per_day: 5 };
        return '<div class="rows"><label class="row"><span class="rt"><b>' + t("Bildirimler açık", "Alerts on") + '</b></span><input type="checkbox" class="switch" data-gbip="enabled"' + (p0.enabled ? " checked" : "") + '></label>' +
          '<div class="row"><span class="rt"><b>' + t("En düşük puan", "Minimum score") + '</b><small>' + t("Yalnızca bu puanın üstündeki yayımlanmış haberler", "Only published stories at or above this score") + '</small></span><span class="seg gbi-mini">' + [50, 75, 90].map(v => '<button data-gbi="pref" data-k="min_score" data-v="' + v + '" aria-pressed="' + (p0.min_score === v) + '">' + v + '</button>').join("") + '</span></div>' +
          '<div class="row"><span class="rt"><b>' + t("Günde en çok", "Max per day") + '</b></span><span class="seg gbi-mini">' + [3, 5, 10].map(v => '<button data-gbi="pref" data-k="max_per_day" data-v="' + v + '" aria-pressed="' + (p0.max_per_day === v) + '">' + v + '</button>').join("") + '</span></div></div>' +
          '<p class="hint" style="margin-top:8px">' + t("Aynı haber için ikinci kez bildirim gönderilmez. Anlık (push) bildirim henüz etkin değil; uyarılar aşağıda listelenir.", "You never get two alerts for the same story. Push delivery is not active yet; alerts are listed below.") + '</p>';
      }) +
      '<div class="h-sec"><h2>' + t("Son uyarılar", "Recent alerts") + '</h2></div>' +
      state("notifs", () => call("bi_notifications?select=story_id,reason,created_at,read_at&order=created_at.desc&limit=30"), l => l.length ? '<div class="rows">' + l.map(n => '<button class="row" data-gbi="story" data-id="' + esc(n.story_id) + '"><span class="rt"><b>' + fdate(n.created_at) + '</b><small>' + esc(reasonText(n.reason, bname)) + '</small></span>' + ic("chev", "ic sm chev") + '</button>').join("") + '</div>' : empty(t("Henüz uyarı yok.", "No alerts yet.")));
    return h + '</main>';
  };
  const reasonText = (r, bname) => { const [k, ref] = String(r).split(":"); return k === "entity" ? bname(ref) : k === "segment" ? segName(ref) : k === "country" ? countryName(ref) : k === "topic" ? topicName(ref) : r; };
  async function savePref(patch) {
    const cur = (G.cache.prefs && G.cache.prefs[0]) || { enabled: true, min_score: 75, max_per_day: 5 };
    const row = { user_id: uid(), enabled: cur.enabled, min_score: cur.min_score, max_per_day: cur.max_per_day, ...patch };
    try { await call("bi_notification_prefs", { method: "POST", body: row, prefer: "resolution=merge-duplicates" }); G.cache.prefs = [row]; toast(t("Kaydedildi", "Saved")); }
    catch (e) { toast(e.message); }
    A.rerender();
  }

  /* ---------- Daha Fazla menüsüne giriş ---------- */
  const origMore = V.more;
  V.more = p => origMore(p).replace('<div class="rows">', '<div class="rows gbi-entry"><button class="row" data-gbi="home"><span class="ri" style="color:var(--np-blue-500)">' + ic("globe") + '</span><span class="rt"><b>Brand Intelligence</b><small>' + t("Marka haberleri, Share of Voice, takip", "Brand news, Share of Voice, follows") + '</small></span>' + ic("chev", "ic sm chev") + '</button></div><div class="rows" style="margin-top:12px">');

  /* ---------- Olaylar ---------- */
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-gbi]");
    if (!el || el.tagName === "A") return;
    e.preventDefault(); e.stopPropagation();
    const d = el.dataset, a = d.gbi, c = A.cur();
    c.y = window.scrollY;
    if (a === "home") return A.go("gbi");
    if (a === "brands") return A.go("gbiBrands");
    if (a === "sov") return A.go("gbiSov");
    if (a === "follow") return A.go("gbiFollow");
    if (a === "login") return A.go("login");
    if (a === "brand") { if (!d.slug) return; return A.go("gbiBrand", { slug: d.slug }); }
    if (a === "story") return A.go("gbiStory", { id: d.id });
    if (a === "topic") return A.go("gbiTopic", { t: d.t });
    if (a === "days") { G.days = +d.d; return A.rerender(); }
    if (a === "sovDays") { G.sov.days = +d.d; return A.rerender(); }
    if (a === "bseg") { c.p.seg = d.s; return A.rerender(); }
    if (a === "btab") { c.p.t = d.t; return A.rerender(); }
    if (a === "retry") { delete G.cache[d.k]; delete G.err[d.k]; delete G.at[d.k]; return A.rerender(); }
    if (a === "followEntity") return toggleFollow("entity", d.id);
    if (a === "unfollow") return toggleFollow("entity", d.id);
    if (a === "pref") return savePref({ [d.k]: +d.v });
    if (a === "sovDel") { G.sov.ids = G.sov.ids.filter(x => x !== d.id); return A.rerender(); }
    if (a === "sovPreset") { const idx = G.brandIndex || []; G.sov.ids = d.s.split(",").map(s => (idx.find(b => b.slug === s) || {}).id).filter(Boolean); if (G.sov.ids.length < 2) toast(t("Markalar yüklenemedi", "Brands could not be loaded")); return A.rerender(); }
    if (a === "sovAdd") {
      const idx = (G.brandIndex || []).filter(b => !G.sov.ids.includes(b.id));
      if (!idx.length) return toast(t("Marka listesi yüklenemedi", "Brand list could not be loaded"));
      return A.ui.sheet('<h2>' + t("Marka seç", "Pick a brand") + '</h2><div class="rows" style="margin-top:12px;max-height:60vh;overflow:auto">' + idx.map(b => '<button class="row" data-gbi="sovPick" data-id="' + esc(b.id) + '"><span class="rt"><b>' + esc(b.name) + '</b><small>' + esc(typeName(b.entity_type)) + '</small></span></button>').join("") + '</div>');
    }
    if (a === "sovPick") { A.ui.closeSheet(); if (G.sov.ids.length < 4) G.sov.ids.push(d.id); return A.rerender(); }
    if (a === "share") { const u = d.u, ti = d.t; if (navigator.share) navigator.share({ title: ti, url: u }).catch(() => { }); else { try { navigator.clipboard.writeText(u); toast(t("Bağlantı kopyalandı", "Link copied")); } catch (_) { } } return; }
  }, true);
  document.addEventListener("change", e => {
    const el = e.target;
    if (el.dataset && el.dataset.gbif) { toggleFollow(el.dataset.gbif, el.dataset.ref); }
    if (el.dataset && el.dataset.gbip) { savePref({ [el.dataset.gbip]: el.checked }); }
  });
  document.addEventListener("input", e => {
    const el = e.target;
    if (el.dataset && el.dataset.gbiq) {
      A.cur().p.q = el.value; const pos = el.selectionStart; A.rerender();
      const n = document.querySelector("[data-gbiq]"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) { } }
    }
  });
  window.NPGbi = { cache: G.cache, reset: () => { for (const k in G.cache) delete G.cache[k]; G.follows = null; } };
})();
