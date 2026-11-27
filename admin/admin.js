/* =========================================================
   COATNEWS · Brand Intelligence yönetim paneli
   Erişim: Supabase Auth ile giriş + bi_staff kaydı. Yetki veritabanında RLS ile uygulanır;
   bu sayfa yalnızca arayüzdür, gizli anahtar içermez (publishable key herkese açıktır).
   Modüller: Genel durum · Editoryal kuyruk · Markalar · Kaynaklar · Arama · Ekip
   ========================================================= */
(function () {
  "use strict";
  const SUPA = "https://qpwkiauhazpyaywjderc.supabase.co", KEY = "sb_publishable_eDv33WBVXDj1bmVkNS3Pxw_-4Cn_iPj";
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fdt = s => s ? new Date(s).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
  const fd = s => s ? new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const SEGS = ["marine", "protective", "powder", "decorative", "energy"];
  const SEGN = { marine: "Marine", protective: "Protective", powder: "Powder", decorative: "Decorative", energy: "Energy" };
  const TOPICS = { A: "Yatırım", B: "Fabrika / kapasite", C: "Yeni ürün", D: "Teknoloji", E: "Satın alma", F: "Ortaklık", G: "Proje", H: "Marine projesi", I: "Protective proje", J: "Toz boya", K: "Dekoratif", L: "Enerji", M: "Sürdürülebilirlik", N: "Finans / kurumsal", O: "Dolaylı geçiş" };
  const STATUS = { discovered: "Keşfedildi", under_review: "İncelemede", approved: "Onaylandı", published: "Yayında", rejected: "Reddedildi", archived: "Arşiv" };
  const TYPES = { manufacturer: "Üretici", corporate_group: "Kurumsal grup", consumer_brand: "Tüketici markası", product_brand: "Ürün markası" };
  const REL = { high: "Yüksek", medium: "Orta", low: "Düşük", unreliable: "Güvenilmez", unknown: "Bilinmiyor" };
  const CTYPE = { news: "haber", press_release: "basın bülteni", opinion: "görüş", sponsored: "sponsorlu", unknown: "tür belirsiz" };
  const LANGS = ["en", "tr", "de", "fr", "it", "es", "nl", "pt", "pl", "zh"];

  const S = { sess: null, me: null, role: null, view: "overview", q: "", status: "under_review", sel: null, brandSel: null, brandQ: "", srcTab: "providers", data: {} };
  try { S.sess = JSON.parse(sessionStorage.getItem("bi_admin_sess") || "null"); } catch (e) { }

  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2200); }

  /* ---------- API ---------- */
  async function refresh() {
    if (!S.sess || !S.sess.refresh_token) return false;
    const r = await fetch(SUPA + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: S.sess.refresh_token }) });
    if (!r.ok) return false;
    const j = await r.json(); S.sess = { access_token: j.access_token, refresh_token: j.refresh_token, user: j.user }; sessionStorage.setItem("bi_admin_sess", JSON.stringify(S.sess)); return true;
  }
  async function api(path, opt = {}, retried) {
    const h = { apikey: KEY, "Content-Type": "application/json", Authorization: "Bearer " + (S.sess ? S.sess.access_token : KEY) };
    if (opt.prefer) h.Prefer = opt.prefer;
    const base = opt.fn ? SUPA + "/functions/v1/" : SUPA + "/rest/v1/";
    const r = await fetch(base + path, { method: opt.method || "GET", headers: h, body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined });
    if (r.status === 401 && !retried && await refresh()) return api(path, opt, true);
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { j = txt; }
    if (!r.ok) { const e = new Error((j && (j.message || j.error)) || ("HTTP " + r.status)); e.status = r.status; e.code = j && j.code; throw e; }
    return j;
  }
  const rpc = (fn, args) => api("rpc/" + fn, { method: "POST", body: args || {} });
  // RLS izin vermezse PostgREST hata değil 0 satır döner: bunu sessiz başarı saymıyoruz.
  const patch = async (table, filter, body) => { const r = await api(table + "?" + filter, { method: "PATCH", body, prefer: "return=representation" }); if (Array.isArray(r) && !r.length) throw new Error("kayıt değişmedi (yetki yok ya da kayıt bulunamadı)"); return r; };
  const insert = (table, body, prefer = "return=representation") => api(table, { method: "POST", body, prefer });
  const del = async (table, filter) => { const r = await api(table + "?" + filter, { method: "DELETE", prefer: "return=representation" }); if (Array.isArray(r) && !r.length) throw new Error("silinmedi (yetki yok ya da kayıt bulunamadı)"); return r; };
  async function guard(fn, ok) { try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { toast("Hata: " + e.message); throw e; } }

  /* ---------- Giriş ---------- */
  async function login(email, password) {
    const r = await fetch(SUPA + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || j.msg || "Giriş başarısız");
    S.sess = { access_token: j.access_token, refresh_token: j.refresh_token, user: j.user };
    sessionStorage.setItem("bi_admin_sess", JSON.stringify(S.sess));
  }
  async function whoami() {
    const uid = S.sess && S.sess.user && S.sess.user.id;
    if (!uid) return null;
    const r = await api("bi_staff?select=role&user_id=eq." + uid);
    return r && r[0] ? r[0].role : null;
  }
  function loginView(msg) {
    $("#root").innerHTML = '<form class="card login" id="loginf"><img src="../app/brand/mark.svg" alt=""><h1 style="margin-top:10px">Brand Intelligence</h1><p class="sub">COATNEWS editör ve yönetici paneli</p>' +
      '<div class="grid"><label class="f">E-posta<input type="email" name="email" required autocomplete="username"></label><label class="f">Şifre<input type="password" name="password" required autocomplete="current-password"></label>' +
      '<p class="err" id="lerr">' + esc(msg || "") + '</p><button class="btn" type="submit">Giriş yap</button></div>' +
      '<p class="muted" style="font-size:12px;margin-top:14px">Yalnızca bi_staff tablosuna eklenmiş hesaplar girebilir. Yetkiler veritabanında uygulanır.</p></form>';
    $("#loginf").onsubmit = async e => {
      e.preventDefault(); const f = new FormData(e.target);
      try { await login(f.get("email"), f.get("password")); boot(); } catch (er) { $("#lerr").textContent = er.message; }
    };
  }

  /* ---------- Kabuk ---------- */
  const NAV = [["overview", "Genel durum"], ["editorial", "Editoryal kuyruk"], ["brands", "Markalar"], ["sources", "Kaynaklar"], ["search", "Arama ve kurallar"], ["team", "Ekip"]];
  function shell(inner) {
    const q = S.data.queueCount;
    $("#root").innerHTML = '<div class="shell"><nav class="side" aria-label="Bölümler"><div class="brand"><img src="../app/brand/mark.svg" alt=""><span>COATNEWS<small>Brand Intelligence</small></span></div>' +
      NAV.filter(([k]) => k !== "team" || S.role === "admin").map(([k, l]) => '<button data-nav="' + k + '"' + (S.view === k ? ' aria-current="page"' : '') + '>' + l + (k === "editorial" && q ? '<span class="n">' + q + '</span>' : '') + '</button>').join("") +
      '<div class="me">' + esc(S.sess.user && S.sess.user.email) + '<br>' + (S.role === "admin" ? "Yönetici" : "Editör") + '<br><button data-act="logout">Çıkış</button></div></nav><main id="main">' + inner + '</main></div>';
  }
  async function render() {
    shell('<p class="muted">Yükleniyor…</p>');
    try {
      const html = await VIEWS[S.view]();
      $("#main").innerHTML = html;
      if (AFTER[S.view]) AFTER[S.view]();
    } catch (e) {
      $("#main").innerHTML = (e.status === 404 || e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST202")
        ? '<div class="notice">Brand Intelligence tabloları bu Supabase projesinde henüz kurulu değil. Kurulum: <code>docs/brand-intelligence/README.md</code> › Kurulum.</div>'
        : '<div class="notice">Veri alınamadı: ' + esc(e.message) + '</div>';
    }
  }

  /* ---------- Görünümler ---------- */
  const VIEWS = {}, AFTER = {};

  VIEWS.overview = async () => {
    const [o, prov, runs, errs] = await Promise.all([
      rpc("bi_overview", {}), api("bi_providers?select=*&order=key.asc"),
      api("bi_scan_runs?select=*&order=started_at.desc&limit=15"), api("bi_scan_logs?select=*&level=eq.error&order=created_at.desc&limit=20")]);
    S.data.queueCount = o.awaiting_review;
    const k = (n, l) => '<div class="card kpi"><b>' + (n ?? 0) + '</b><small>' + l + '</small></div>';
    return '<h1>Genel durum</h1><p class="sub">Son 30 gün · tüm sayılar veritabanındaki kayıtlardan</p>' +
      '<div class="grid g4">' + k(o.monitored_brands, "izlenen marka") + k(o.stories_discovered, "bulunan haber") + k(o.stories_published, "yayımlanan") + k(o.awaiting_review, "inceleme bekliyor") + k(o.active_providers, "etkin sağlayıcı") + k(o.active_feeds, "etkin RSS") + k(o.countries, "ülke") + '</div>' +
      '<div class="bar" style="margin-top:16px"><h2 style="margin:0" class="grow">Sağlayıcılar</h2><button class="btn" data-act="scanNow">Şimdi tara</button></div>' +
      '<table><thead><tr><th>Sağlayıcı</th><th>Durum</th><th>Son başarı</th><th class="num">Toplanan</th><th class="num">Bugün / kota</th><th>Hız sınırı</th><th>Son hata</th></tr></thead><tbody>' +
      prov.map(p => '<tr><td><b>' + esc(p.name) + '</b><br><span class="muted">' + esc(p.key) + (p.requires_key ? ' · anahtar: ' + esc(p.key_env) : '') + '</span></td><td>' + (p.is_enabled ? (p.consecutive_errors ? '<span class="bad-dot"></span>Hatalı (' + p.consecutive_errors + ')' : '<span class="ok-dot"></span>Etkin') : '<span class="off-dot"></span>Kapalı') + '</td><td>' + fdt(p.last_success_at) + '</td><td class="num">' + p.articles_retrieved + '</td><td class="num">' + p.used_today + (p.daily_quota ? ' / ' + p.daily_quota : '') + '</td><td>' + (p.rate_limited_until && new Date(p.rate_limited_until) > new Date() ? fdt(p.rate_limited_until) + "'e kadar" : '—') + '</td><td class="muted">' + esc(p.last_error || "—") + '</td></tr>').join("") + '</tbody></table>' +
      '<h2>Tarama geçmişi</h2><table><thead><tr><th>Başlangıç</th><th>Durum</th><th>Tetik</th><th class="num">Aday</th><th class="num">İlgili</th><th class="num">Yeni</th><th class="num">Birleşen</th><th class="num">İnceleme</th><th>Süre</th></tr></thead><tbody>' +
      (runs.length ? runs.map(r => { const s = r.stats || {}; return '<tr><td>' + fdt(r.started_at) + '</td><td><span class="pill" style="--c:' + (r.status === "ok" ? "var(--green)" : r.status === "running" ? "var(--sky)" : r.status === "partial" ? "var(--orange)" : "var(--red)") + '">' + esc(r.status) + '</span></td><td>' + esc(r.trigger) + '</td><td class="num">' + (s.candidates ?? "—") + '</td><td class="num">' + (s.relevant ?? "—") + '</td><td class="num">' + (s.new_stories ?? "—") + '</td><td class="num">' + (s.merged ?? "—") + '</td><td class="num">' + (s.review ?? "—") + '</td><td>' + (r.finished_at ? Math.round((new Date(r.finished_at) - new Date(r.started_at)) / 1000) + " sn" : "—") + '</td></tr>'; }).join("") : '<tr><td colspan="9" class="muted">Henüz tarama yapılmadı.</td></tr>') + '</tbody></table>' +
      '<h2>Son hatalar</h2>' + (errs.length ? '<table><tbody>' + errs.map(e => '<tr><td style="width:130px">' + fdt(e.created_at) + '</td><td style="width:110px">' + esc(e.provider_key || "—") + '</td><td>' + esc(e.message) + '</td></tr>').join("") + '</tbody></table>' : '<p class="muted">Kayıtlı hata yok.</p>');
  };

  // ---------------------------------------------------------------- Editoryal
  VIEWS.editorial = async () => {
    const list = await rpc("bi_stories_feed", { p_limit: 100, p_status: S.status });
    S.data.stories = list;
    let detail = '<div class="card detail muted">Ayrıntı için listeden bir haber seç.</div>';
    if (S.sel) { try { detail = await storyDetail(S.sel); } catch (e) { detail = '<div class="card detail">Haber yüklenemedi: ' + esc(e.message) + '</div>'; } }
    return '<h1>Editoryal kuyruk</h1><p class="sub">Düşük güvenli ve belirsiz sonuçlar burada bekler. Otomatik yayın ayarı “Arama ve kurallar” bölümündedir.</p>' +
      '<div class="tabs">' + Object.entries(STATUS).map(([k, l]) => '<button data-status="' + k + '" aria-pressed="' + (S.status === k) + '">' + l + '</button>').join("") + '</div>' +
      '<div class="split"><div>' + (list.length ? '<table><thead><tr><th>Haber</th><th class="num">Puan</th><th>Tarih</th></tr></thead><tbody>' +
        list.map(s => '<tr class="click' + (S.sel === s.id ? ' sel' : '') + '" data-story="' + s.id + '"><td><b>' + esc(s.title) + '</b><br><span class="muted">' + esc(s.main ? s.main.name : "ana marka yok") + ' · ' + esc(s.publisher || s.domain || "") + (s.source_count > 1 ? ' · ' + s.source_count + ' kaynak' : '') + '</span>' + (s.review_reason ? '<br><span class="pill st-under_review">' + esc(s.review_reason) + '</span>' : '') + '</td><td class="num">' + (s.overall_score ?? "—") + '</td><td>' + fd(s.first_published_at) + '</td></tr>').join("") + '</tbody></table>'
        : '<p class="muted">Bu durumda haber yok.</p>') + '</div>' + detail + '</div>';
  };

  async function storyDetail(id) {
    const d = await rpc("bi_story", { p_id: id });
    if (!d) return '<div class="card detail">Haber bulunamadı.</div>';
    const s = d.story, bd = s.score_breakdown || {};
    S.data.story = d;
    if (!S.data.entities) S.data.entities = await api("bi_entities?select=id,slug,name&order=name.asc");
    const pri = (d.sources || []).find(x => x.primary) || (d.sources || [])[0];
    const src = pri ? (await api("bi_sources?select=*&domain=eq." + encodeURIComponent(pri.domain || "")))[0] : null;
    return '<div class="card detail" id="sd"><span class="pill st-' + s.status + '">' + STATUS[s.status] + '</span> <span class="muted">' + esc(CTYPE[s.content_type] || s.content_type) + (s.is_promotional ? ' · tanıtım' : '') + '</span>' +
      '<h3>' + esc(s.title) + '</h3>' +
      '<div class="bar">' + ["approved", "published", "under_review", "rejected", "archived"].filter(x => x !== s.status).map(x => '<button class="btn sm ' + (x === "published" ? "ok" : x === "rejected" ? "bad" : "sec") + '" data-setstatus="' + x + '">' + ({ approved: "Onayla", published: "Yayımla", under_review: "İncelemeye al", rejected: "Reddet", archived: "Arşivle" })[x] + '</button>').join("") + '</div>' +
      '<div class="form"><label class="f wide">Başlık düzeltmesi (boşsa orijinal başlık)<input type="text" id="hl" value="' + esc(s.headline_override || "") + '" placeholder="' + esc(s.title) + '"></label>' +
      '<label class="f wide">COATNEWS kısa özeti (kendi cümlelerimizle; yayıncı metni kopyalanmaz)<textarea id="sum">' + esc(s.summary || "") + '</textarea></label>' +
      '<label class="f"><span><input type="checkbox" id="sumai"' + (s.summary_is_ai ? " checked" : "") + '> Özet yapay zekâ yardımıyla hazırlandı</span></label>' +
      '<label class="f">Genel puan<input type="number" id="score" min="0" max="100" value="' + (s.overall_score ?? "") + '"></label>' +
      '<label class="f">Ülke (ISO2)<input type="text" id="ctry" maxlength="2" value="' + esc(s.country_iso2 || "") + '"></label>' +
      '<label class="f wide">Etiketler (virgülle)<input type="text" id="tags" value="' + esc((s.tags || []).join(", ")) + '"></label>' +
      '<div class="f wide">Segmentler<div class="checks">' + SEGS.map(k => '<label><input type="checkbox" name="seg" value="' + k + '"' + ((s.segments || []).includes(k) ? " checked" : "") + '>' + SEGN[k] + '</label>').join("") + '</div></div>' +
      '<div class="f wide">Konular<div class="checks">' + Object.entries(TOPICS).map(([k, l]) => '<label><input type="checkbox" name="top" value="' + k + '"' + ((s.topics || []).includes(k) ? " checked" : "") + '>' + k + ' · ' + l + '</label>').join("") + '</div></div></div>' +
      '<div class="bar" style="margin-top:12px"><button class="btn" data-act="saveStory">Değişiklikleri kaydet</button></div>' +
      '<h2>Markalar</h2>' + (d.brands || []).map(b => '<div class="bar" style="margin:0 0 6px"><b class="grow">' + esc(b.name) + '</b><select data-role="' + b.id + '" style="width:130px">' + ["main", "mentioned", "parent"].map(r => '<option value="' + r + '"' + (b.role === r ? " selected" : "") + '>' + ({ main: "Ana konu", mentioned: "Geçiyor", parent: "Ana şirket" })[r] + '</option>').join("") + '</select><button class="btn sm bad" data-delbrand="' + b.id + '">Kaldır</button></div>' + (b.evidence || []).slice(0, 2).map(x => '<div class="ev">' + esc(x) + '</div>').join("")).join("") +
      '<div class="bar"><select id="addb" class="grow"><option value="">Marka ekle…</option>' + S.data.entities.map(e => '<option value="' + e.id + '">' + esc(e.name) + '</option>').join("") + '</select><button class="btn sm sec" data-act="addBrand">Ekle</button></div>' +
      '<h2>Kaynaklar (' + (d.sources || []).length + ')</h2>' + (d.sources || []).map(x => '<div style="margin:0 0 8px"><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.publisher || x.domain) + '</a>' + (x.primary ? ' <span class="pill">birincil</span>' : '') + '<br><span class="muted">' + fdt(x.published_at) + ' · ' + esc(x.title) + '</span></div>').join("") +
      (pri ? '<div class="bar"><span class="grow">Kaynak güvenilirliği: <b>' + esc(pri.domain) + '</b></span><select id="rel" style="width:140px">' + Object.entries(REL).map(([k, l]) => '<option value="' + k + '"' + ((src ? src.reliability : "unknown") === k ? " selected" : "") + '>' + l + '</option>').join("") + '</select><button class="btn sm sec" data-act="saveRel" data-domain="' + esc(pri.domain) + '">Kaydet</button></div>' : '') +
      '<h2>Tekrarları birleştir</h2><div class="bar"><input type="text" id="mergeinto" class="grow" placeholder="Hedef haber kimliği (uuid)"><button class="btn sm warn" data-act="merge">Bu haberi hedefe birleştir</button></div>' +
      '<h2>Puan dökümü</h2><pre>' + esc(JSON.stringify({ marka: s.brand_score, segment: s.segment_score, kaynak: s.source_confidence, genel: s.overall_score, ...bd }, null, 2)) + '</pre>' +
      ((d.segments || []).some(g => (g.evidence || []).length) ? '<h2>Segment kanıtı</h2>' + d.segments.map(g => (g.evidence || []).map(x => '<div class="ev"><b>' + SEGN[g.key] + '</b> · ' + esc(x) + '</div>').join("")).join("") : '') + '</div>';
  }

  // ---------------------------------------------------------------- Markalar
  VIEWS.brands = async () => {
    const list = await api("bi_entities?select=*&order=priority.asc,name.asc");
    S.data.entities = list;
    const q = S.brandQ.toLocaleLowerCase("tr");
    const f = list.filter(e => !q || e.name.toLocaleLowerCase("tr").includes(q) || e.slug.includes(q));
    const name = id => (list.find(x => x.id === id) || {}).name || "";
    let detail = '<div class="card detail"><h2 style="margin-top:0">Yeni marka</h2>' + brandForm({}, list) + '</div>';
    if (S.brandSel) { const e = list.find(x => x.id === S.brandSel); if (e) detail = '<div class="card detail">' + brandForm(e, list) + await aliasBlock(e) + '</div>'; }
    return '<h1>Markalar</h1><p class="sub">Üretici, kurumsal grup, tüketici markası ve ürün markası ayrı varlıklardır. Ana şirket ilişkisi “ana şirket” alanıyla kurulur.</p>' +
      '<div class="bar"><input type="text" id="bq" class="grow" placeholder="Ara" value="' + esc(S.brandQ) + '"><button class="btn sec" data-act="newBrand">+ Yeni marka</button></div>' +
      '<div class="split"><table><thead><tr><th>Marka</th><th>Tür</th><th>Ana şirket</th><th class="num">Haber</th><th>Son tarama</th></tr></thead><tbody>' +
      f.map(e => '<tr class="click' + (S.brandSel === e.id ? ' sel' : '') + '" data-brand="' + e.id + '"><td><b>' + esc(e.name) + '</b>' + (e.is_active ? '' : ' <span class="pill" style="--c:var(--ink3)">pasif</span>') + (e.merged_into_id ? ' <span class="pill" style="--c:var(--ink3)">birleşti</span>' : '') + (e.data_verified ? '' : ' <span class="pill" style="--c:var(--orange)" title="Web sitesi / ana şirket elle doğrulanmadı">doğrulanmadı</span>') + '<br><span class="muted">' + esc(e.slug) + ' · ' + (e.country_iso2 || "—") + ' · öncelik ' + e.priority + '</span></td><td>' + TYPES[e.entity_type] + '</td><td>' + esc(name(e.parent_id) || e.parent_note || "—") + '</td><td class="num">' + e.article_count + '</td><td>' + fdt(e.last_scan_at) + '</td></tr>').join("") + '</tbody></table>' + detail + '</div>';
  };
  AFTER.brands = () => { const i = $("#bq"); if (i) { i.oninput = () => { S.brandQ = i.value; clearTimeout(i.t); i.t = setTimeout(() => render().then(() => { const n = $("#bq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }), 250); }; } };
  function brandForm(e, list) {
    const v = k => esc(e[k] ?? ""), arr = k => esc((e[k] || []).join(", "));
    return '<form id="bform" data-id="' + (e.id || "") + '"><div class="form">' +
      '<label class="f">Resmi ad<input type="text" name="name" required value="' + v("name") + '"></label>' +
      '<label class="f">Kısa ad (slug)<input type="text" name="slug" required pattern="[a-z0-9\\-]+" value="' + v("slug") + '"></label>' +
      '<label class="f">Tür<select name="entity_type">' + Object.entries(TYPES).map(([k, l]) => '<option value="' + k + '"' + (e.entity_type === k ? " selected" : "") + '>' + l + '</option>').join("") + '</select></label>' +
      '<label class="f">Ana şirket<select name="parent_id"><option value="">—</option>' + list.filter(x => x.id !== e.id).map(x => '<option value="' + x.id + '"' + (e.parent_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>').join("") + '</select></label>' +
      '<label class="f">Ana şirket notu<input type="text" name="parent_note" value="' + v("parent_note") + '"></label>' +
      '<label class="f">Ülke (ISO2)<input type="text" name="country_iso2" maxlength="2" value="' + v("country_iso2") + '"></label>' +
      '<label class="f">Resmi web sitesi<input type="url" name="website" value="' + v("website") + '"></label>' +
      '<label class="f">Haber odası sayfası<input type="url" name="newsroom_url" value="' + v("newsroom_url") + '"></label>' +
      '<label class="f">Haber odası RSS<input type="url" name="newsroom_feed_url" value="' + v("newsroom_feed_url") + '"></label>' +
      '<label class="f">Logo adresi<input type="url" name="logo_url" value="' + v("logo_url") + '"></label>' +
      '<label class="f">Öncelik (1 en yüksek)<input type="number" name="priority" min="1" max="5" value="' + (e.priority || 3) + '"></label>' +
      '<label class="f wide">Ürün aileleri (virgülle)<input type="text" name="product_families" value="' + arr("product_families") + '"></label>' +
      '<label class="f wide">Ek arama kelimeleri (virgülle)<input type="text" name="search_keywords" value="' + arr("search_keywords") + '"></label>' +
      '<label class="f wide">Dışlama kelimeleri (virgülle)<input type="text" name="exclusion_keywords" value="' + arr("exclusion_keywords") + '"></label>' +
      '<div class="f wide">Segmentler<div class="checks">' + SEGS.map(k => '<label><input type="checkbox" name="segments" value="' + k + '"' + ((e.segments || []).includes(k) ? " checked" : "") + '>' + SEGN[k] + '</label>').join("") + '</div></div>' +
      '<div class="f wide">Arama dilleri<div class="checks">' + LANGS.map(k => '<label><input type="checkbox" name="languages" value="' + k + '"' + ((e.languages || ["en"]).includes(k) ? " checked" : "") + '>' + k + '</label>').join("") + '</div></div>' +
      '<div class="f wide"><div class="checks"><label><input type="checkbox" name="is_active"' + (e.is_active !== false ? " checked" : "") + '>İzleme etkin</label><label><input type="checkbox" name="logo_authorized"' + (e.logo_authorized ? " checked" : "") + '>Logo kullanım izni var</label><label><input type="checkbox" name="data_verified"' + (e.data_verified ? " checked" : "") + '>Bilgiler doğrulandı</label></div></div>' +
      '<label class="f wide">Notlar<textarea name="notes">' + esc(e.notes || "") + '</textarea></label></div>' +
      '<div class="bar" style="margin-top:12px"><button class="btn" type="submit">' + (e.id ? "Kaydet" : "Marka ekle") + '</button>' +
      (e.id && S.role === "admin" ? '<select id="mergeb" style="width:200px"><option value="">Şuna birleştir…</option>' + list.filter(x => x.id !== e.id && !x.merged_into_id).map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join("") + '</select><button class="btn sm warn" type="button" data-act="mergeBrand">Birleştir</button><button class="btn sm bad" type="button" data-act="deleteBrand">Sil</button>' : '') + '</div></form>';
  }
  async function aliasBlock(e) {
    const al = await api("bi_entity_aliases?select=*&entity_id=eq." + e.id + "&order=alias.asc");
    return '<h2>Alternatif adlar</h2><p class="muted" style="margin-top:-4px">Belirsiz işaretli adlar (ör. “Marshall”, “PPG”) yalnızca metinde boya/kaplama bağlamı varsa sayılır ve tek başına aranmaz.</p>' +
      '<table><thead><tr><th>Ad</th><th>Dil</th><th>Belirsiz</th><th>Büyük/küçük harf</th><th>Aramada</th><th></th></tr></thead><tbody>' +
      al.map(a => '<tr><td>' + esc(a.alias) + '</td><td>' + esc(a.lang || "tümü") + '</td><td><input type="checkbox" data-alias="' + a.id + '" data-k="is_ambiguous"' + (a.is_ambiguous ? " checked" : "") + '></td><td><input type="checkbox" data-alias="' + a.id + '" data-k="case_sensitive"' + (a.case_sensitive ? " checked" : "") + '></td><td><input type="checkbox" data-alias="' + a.id + '" data-k="use_in_search"' + (a.use_in_search ? " checked" : "") + '></td><td><button class="btn sm bad" data-delalias="' + a.id + '">Sil</button></td></tr>').join("") + '</tbody></table>' +
      '<div class="bar" style="margin-top:8px"><input type="text" id="newalias" class="grow" placeholder="Yeni ad, ör. Jotun Coatings"><select id="newalang" style="width:90px"><option value="">tümü</option>' + LANGS.map(l => '<option>' + l + '</option>').join("") + '</select><label class="checks"><label><input type="checkbox" id="newaamb">belirsiz</label></label><button class="btn sm" data-act="addAlias" data-entity="' + e.id + '">Ekle</button></div>';
  }

  // ---------------------------------------------------------------- Kaynaklar
  VIEWS.sources = async () => {
    const tabs = '<div class="tabs">' + [["providers", "API sağlayıcıları"], ["feeds", "RSS ve haber odaları"], ["domains", "Yayıncı alan adları"]].map(([k, l]) => '<button data-srctab="' + k + '" aria-pressed="' + (S.srcTab === k) + '">' + l + '</button>').join("") + '</div>';
    let body = "";
    if (S.srcTab === "providers") {
      const prov = await api("bi_providers?select=*&order=key.asc");
      body = '<div class="notice info">API anahtarları burada girilmez; Supabase › Edge Functions › Secrets bölümünde tutulur. Ücretli bir planı açmadan önce sağlayıcının koşullarını okuyun.</div>' +
        prov.map(p => '<div class="card" style="margin:0 0 12px"><div class="bar"><b class="grow">' + esc(p.name) + '</b><label class="checks"><label><input type="checkbox" data-prov="' + p.key + '" data-k="is_enabled"' + (p.is_enabled ? " checked" : "") + '>Etkin</label></label></div>' +
          '<p class="muted" style="margin:0 0 10px">' + esc(p.terms_notes || "") + '</p><div class="form">' +
          '<label class="f">Günlük kota<input type="number" data-prov="' + p.key + '" data-k="daily_quota" value="' + (p.daily_quota ?? "") + '"></label>' +
          '<label class="f">İstekler arası en az (ms)<input type="number" data-prov="' + p.key + '" data-k="min_interval_ms" value="' + p.min_interval_ms + '"></label>' +
          '<label class="f wide">Ayarlar (JSON)<textarea data-prov="' + p.key + '" data-k="config">' + esc(JSON.stringify(p.config, null, 1)) + '</textarea></label></div>' +
          '<div class="bar"><span class="grow muted">' + (p.requires_key ? 'Gerekli gizli anahtar: <code>' + esc(p.key_env) + '</code> · ' : '') + 'Son hata: ' + esc(p.last_error || "—") + '</span><button class="btn sm" data-act="saveProv" data-key="' + p.key + '">Kaydet</button></div></div>').join("");
    } else if (S.srcTab === "feeds") {
      const [feeds, ents] = await Promise.all([api("bi_feeds?select=*&order=name.asc"), api("bi_entities?select=id,name,website&order=name.asc")]);
      const en = id => (ents.find(x => x.id === id) || {}).name || "—";
      body = '<div class="card" style="margin:0 0 14px"><h2 style="margin-top:0">Resmi haber odası beslemesi bul</h2><p class="muted" style="margin-top:-4px">Besleme adresi tahmin edilmez: resmi sayfadaki RSS/Atom bağlantısı okunur.</p><div class="bar"><select id="discEnt" style="width:220px"><option value="">Marka seç…</option>' + ents.map(e => '<option value="' + e.id + '" data-web="' + esc(e.website || "") + '">' + esc(e.name) + '</option>').join("") + '</select><input type="url" id="discUrl" class="grow" placeholder="https://… haber odası sayfası"><button class="btn" data-act="discover">Keşfet</button></div><div id="discOut"></div></div>' +
        '<div class="card" style="margin:0 0 14px"><h2 style="margin-top:0">Besleme ekle</h2><div class="form"><label class="f wide">RSS / Atom adresi<input type="url" id="fUrl"></label><label class="f">Ad<input type="text" id="fName"></label><label class="f">Dil<select id="fLang"><option value="">—</option>' + LANGS.map(l => '<option>' + l + '</option>').join("") + '</select></label><label class="f">Marka (resmi kaynaksa)<select id="fEnt"><option value="">—</option>' + ents.map(e => '<option value="' + e.id + '">' + esc(e.name) + '</option>').join("") + '</select></label></div><div class="bar" style="margin-top:10px"><button class="btn sec" data-act="testFeed">Dene</button><button class="btn" data-act="addFeed">Ekle</button></div><div id="testOut"></div></div>' +
        '<table><thead><tr><th>Besleme</th><th>Marka</th><th>Son başarı</th><th class="num">Görülen</th><th>Son hata</th><th>Etkin</th><th></th></tr></thead><tbody>' +
        (feeds.length ? feeds.map(f => '<tr><td><b>' + esc(f.name) + '</b><br><a class="muted" href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.url) + '</a></td><td>' + esc(en(f.entity_id)) + '</td><td>' + fdt(f.last_success_at) + '</td><td class="num">' + f.items_seen + '</td><td class="muted">' + esc(f.last_error || "—") + '</td><td><input type="checkbox" data-feed="' + f.id + '"' + (f.is_active ? " checked" : "") + '></td><td><button class="btn sm bad" data-delfeed="' + f.id + '">Sil</button></td></tr>').join("") : '<tr><td colspan="7" class="muted">Henüz besleme yok.</td></tr>') + '</tbody></table>';
    } else {
      const doms = await api("bi_sources?select=*&order=domain.asc");
      body = '<div class="card" style="margin:0 0 14px"><div class="bar"><input type="text" id="dNew" class="grow" placeholder="alanadi.com"><select id="dRel" style="width:140px">' + Object.entries(REL).map(([k, l]) => '<option value="' + k + '">' + l + '</option>').join("") + '</select><button class="btn" data-act="addDomain">Ekle</button></div></div>' +
        '<table><thead><tr><th>Alan adı</th><th>Güvenilirlik</th><th>Resmi</th><th>Engelli</th><th></th></tr></thead><tbody>' +
        (doms.length ? doms.map(d => '<tr><td>' + esc(d.domain) + '</td><td><select data-dom="' + d.id + '" data-k="reliability">' + Object.entries(REL).map(([k, l]) => '<option value="' + k + '"' + (d.reliability === k ? " selected" : "") + '>' + l + '</option>').join("") + '</select></td><td><input type="checkbox" data-dom="' + d.id + '" data-k="is_official"' + (d.is_official ? " checked" : "") + '></td><td><input type="checkbox" data-dom="' + d.id + '" data-k="is_blocked"' + (d.is_blocked ? " checked" : "") + '></td><td><button class="btn sm bad" data-deldom="' + d.id + '">Sil</button></td></tr>').join("") : '<tr><td colspan="5" class="muted">Kayıt yok. Bilinmeyen alan adları “Bilinmiyor” güveniyle puanlanır.</td></tr>') + '</tbody></table>';
    }
    return '<h1>Kaynaklar</h1><p class="sub">Kapsam ölçülebilir ve genişletilebilir: her kaynak ayrı izlenir.</p>' + tabs + body;
  };

  // ---------------------------------------------------------------- Arama ve kurallar
  VIEWS.search = async () => {
    const [langs, terms, settings] = await Promise.all([api("bi_languages?select=*&order=code.asc"), api("bi_query_terms?select=*&order=lang.asc,kind.asc,term.asc"), api("bi_settings?select=*")]);
    const st = Object.fromEntries(settings.map(x => [x.key, x.value]));
    const th = st.thresholds || {}, pb = st.publishing || {}, sc = st.scan || {}, w = st.weights || {};
    const num = (k, sub, v, step = 1) => '<label class="f">' + sub + '<input type="number" step="' + step + '" data-set="' + k + '" value="' + v + '"></label>';
    return '<h1>Arama ve kurallar</h1><p class="sub">Sorgular marka adları × dil başına terimlerden otomatik üretilir.</p>' +
      '<div class="grid g2"><div class="card"><h2 style="margin-top:0">Puan eşikleri</h2><div class="form">' + num("thresholds.very_high", "Çok yüksek ≥", th.very_high) + num("thresholds.high", "Yüksek ≥", th.high) + num("thresholds.medium", "Orta ≥", th.medium) + '</div>' +
      '<h2>Ağırlıklar</h2><div class="form">' + num("weights.brand", "Marka", w.brand, .05) + num("weights.segment", "Segment", w.segment, .05) + num("weights.source", "Kaynak", w.source, .05) + num("weights.freshness", "Tazelik", w.freshness, .05) + '</div></div>' +
      '<div class="card"><h2 style="margin-top:0">Yayın politikası</h2><div class="checks" style="margin-bottom:10px"><label><input type="checkbox" data-set="publishing.auto_publish"' + (pb.auto_publish ? " checked" : "") + '>Yüksek puanlı haberleri otomatik onay kuyruğuna al</label></div>' +
      '<div class="notice" style="font-size:12.5px">Otomatik onay bile haberi doğrudan yayımlamaz; tanıtım içerikleri ve belirsiz eşleşmeler her zaman editöre düşer.</div><div class="form">' +
      num("publishing.auto_publish_min", "Otomatik onay ≥", pb.auto_publish_min) + num("publishing.review_below", "İncelemeye al <", pb.review_below) + num("publishing.reject_below", "Reddet <", pb.reject_below) + '</div>' +
      '<h2>Tarama</h2><div class="form">' + num("scan.interval_minutes", "Aralık (dk)", sc.interval_minutes) + num("scan.overlap_minutes", "Örtüşme (dk)", sc.overlap_minutes) + num("scan.queries_per_run", "Tur başına sorgu", sc.queries_per_run) + num("scan.time_budget_ms", "Zaman bütçesi (ms)", sc.time_budget_ms, 1000) + '</div>' +
      '<p class="muted" style="font-size:12px">Aralık değişirse pg_cron zamanlaması da aynı değere göre güncellenmelidir.</p></div></div>' +
      '<div class="bar" style="margin-top:12px"><button class="btn" data-act="saveSettings">Kuralları kaydet</button></div>' +
      '<h2>Diller</h2><div class="checks">' + langs.map(l => '<label><input type="checkbox" data-lang="' + l.code + '"' + (l.is_active ? " checked" : "") + '>' + esc(l.name) + ' (' + l.code + ')</label>').join("") + '</div>' +
      '<h2>Arama terimleri</h2><div class="grid g2">' + langs.map(l => '<div class="card"><b>' + esc(l.name) + '</b>' + ["context", "business"].map(k => '<div style="margin-top:8px"><span class="muted">' + (k === "context" ? "Boya/kaplama bağlamı" : "İş konusu") + '</span><div class="chips" style="margin-top:4px">' + terms.filter(t => t.lang === l.code && t.kind === k).map(t => '<span class="chip">' + esc(t.term) + '<button class="x" data-delterm="' + t.id + '" aria-label="Sil">×</button></span>').join("") + '</div></div>').join("") +
        '<div class="bar" style="margin-top:8px"><input type="text" data-newterm="' + l.code + '" class="grow" placeholder="Yeni terim"><select data-newkind="' + l.code + '" style="width:120px"><option value="context">bağlam</option><option value="business">iş</option></select><button class="btn sm" data-act="addTerm" data-lang="' + l.code + '">Ekle</button></div></div>').join("") + '</div>' +
      '<h2>Üretilen sorgular</h2><div class="bar"><button class="btn sec" data-act="previewQ">Sorguları göster</button></div><div id="qOut"></div>';
  };

  // ---------------------------------------------------------------- Ekip
  VIEWS.team = async () => {
    const st = await api("bi_staff?select=*&order=created_at.asc");
    return '<h1>Ekip</h1><p class="sub">Editörler haberleri yönetir; yöneticiler ayrıca marka, kaynak, kural ve ekip yönetir.</p>' +
      '<table><thead><tr><th>Kullanıcı kimliği</th><th>Rol</th><th>Eklenme</th><th></th></tr></thead><tbody>' + st.map(x => '<tr><td><code>' + esc(x.user_id) + '</code>' + (x.user_id === S.sess.user.id ? ' (sen)' : '') + '</td><td><select data-staff="' + x.user_id + '"><option value="editor"' + (x.role === "editor" ? " selected" : "") + '>Editör</option><option value="admin"' + (x.role === "admin" ? " selected" : "") + '>Yönetici</option></select></td><td>' + fd(x.created_at) + '</td><td>' + (x.user_id === S.sess.user.id ? '' : '<button class="btn sm bad" data-delstaff="' + x.user_id + '">Çıkar</button>') + '</td></tr>').join("") + '</tbody></table>' +
      '<div class="card" style="margin-top:14px"><div class="bar"><input type="text" id="newStaff" class="grow" placeholder="Supabase kullanıcı kimliği (uuid)"><select id="newRole" style="width:130px"><option value="editor">Editör</option><option value="admin">Yönetici</option></select><button class="btn" data-act="addStaff">Ekle</button></div><p class="muted" style="font-size:12px;margin:6px 0 0">Kullanıcı önce COATNEWS uygulamasında hesap açmalıdır; kimliği Supabase › Authentication › Users sayfasında görünür.</p></div>';
  };

  /* ---------- Olaylar ---------- */
  const val = id => ($(id) ? $(id).value.trim() : "");
  const list = s => s.split(",").map(x => x.trim()).filter(Boolean);
  document.addEventListener("click", async ev => {
    const t = ev.target.closest("[data-nav],[data-act],[data-status],[data-story],[data-setstatus],[data-delbrand],[data-brand],[data-delalias],[data-srctab],[data-delfeed],[data-deldom],[data-delterm],[data-delstaff]");
    if (!t) return;
    const d = t.dataset;
    if (d.nav) { S.view = d.nav; S.sel = null; return render(); }
    if (d.status) { S.status = d.status; S.sel = null; return render(); }
    if (d.story) { S.sel = d.story; return render(); }
    if (d.brand) { S.brandSel = d.brand; return render(); }
    if (d.srctab) { S.srcTab = d.srctab; return render(); }
    try {
      if (d.setstatus) { await guard(() => patch("bi_stories", "id=eq." + S.sel, { status: d.setstatus, reviewed_by: S.sess.user.id, reviewed_at: new Date().toISOString() }), STATUS[d.setstatus]); return render(); }
      if (d.delbrand) { await guard(() => del("bi_story_entities", "story_id=eq." + S.sel + "&entity_id=eq." + d.delbrand), "Marka kaldırıldı"); return render(); }
      if (d.delalias) { await guard(() => del("bi_entity_aliases", "id=eq." + d.delalias), "Silindi"); return render(); }
      if (d.delfeed) { if (!confirm("Besleme silinsin mi?")) return; await guard(() => del("bi_feeds", "id=eq." + d.delfeed), "Silindi"); return render(); }
      if (d.deldom) { await guard(() => del("bi_sources", "id=eq." + d.deldom), "Silindi"); return render(); }
      if (d.delterm) { await guard(() => del("bi_query_terms", "id=eq." + d.delterm), "Silindi"); return render(); }
      if (d.delstaff) { if (!confirm("Ekipten çıkarılsın mı?")) return; await guard(() => del("bi_staff", "user_id=eq." + d.delstaff), "Çıkarıldı"); return render(); }
      const a = d.act;
      if (a === "logout") { sessionStorage.removeItem("bi_admin_sess"); S.sess = null; return loginView(); }
      if (a === "scanNow") { t.disabled = true; toast("Tarama başladı, bu bir iki dakika sürebilir"); const r = await guard(() => api("brand-scan", { fn: true, method: "POST", body: {} })); toast("Tarama bitti: " + (r.status || "") + " · yeni " + ((r.stats && r.stats.new_stories) ?? 0)); return render(); }
      if (a === "saveStory") {
        const segs = [...document.querySelectorAll('input[name="seg"]:checked')].map(x => x.value), tops = [...document.querySelectorAll('input[name="top"]:checked')].map(x => x.value);
        const sc = val("#score");
        await guard(async () => {
          await patch("bi_stories", "id=eq." + S.sel, { headline_override: val("#hl") || null, summary: val("#sum") || null, summary_is_ai: $("#sumai").checked, overall_score: sc === "" ? null : Math.max(0, Math.min(100, +sc)), country_iso2: val("#ctry").toUpperCase() || null, tags: list(val("#tags")), segments: segs, topics: tops });
          const cur = (S.data.story.segments || []).map(g => g.key);
          for (const k of segs.filter(k => !cur.includes(k))) await insert("bi_story_segments", { story_id: S.sel, segment_key: k, editor_set: true }, "return=minimal");
          for (const k of cur.filter(k => !segs.includes(k))) await del("bi_story_segments", "story_id=eq." + S.sel + "&segment_key=eq." + k);
          for (const sel of document.querySelectorAll("select[data-role]")) await patch("bi_story_entities", "story_id=eq." + S.sel + "&entity_id=eq." + sel.dataset.role, { role: sel.value, editor_set: true });
          const main = [...document.querySelectorAll("select[data-role]")].find(x => x.value === "main");
          await patch("bi_stories", "id=eq." + S.sel, { main_entity_id: main ? main.dataset.role : null });
        }, "Kaydedildi");
        return render();
      }
      if (a === "addBrand") { const id = val("#addb"); if (!id) return; await guard(() => insert("bi_story_entities", { story_id: S.sel, entity_id: id, role: "mentioned", editor_set: true, mention_count: 0 }, "return=minimal"), "Marka eklendi"); return render(); }
      if (a === "saveRel") { await guard(() => insert("bi_sources?on_conflict=domain", { domain: d.domain, reliability: val("#rel") }, "resolution=merge-duplicates,return=minimal"), "Güvenilirlik kaydedildi"); return; }
      if (a === "merge") { const into = val("#mergeinto"); if (!/^[0-9a-f-]{36}$/i.test(into)) return toast("Geçerli bir haber kimliği gir"); await guard(() => rpc("bi_merge_stories", { p_from: S.sel, p_into: into }), "Birleştirildi"); S.sel = into; return render(); }
      if (a === "newBrand") { S.brandSel = null; return render(); }
      if (a === "mergeBrand") { const into = val("#mergeb"); if (!into || !confirm("Bu marka seçilen markaya birleştirilsin mi? Alternatif adlar ve haber ilişkileri taşınır.")) return; await guard(() => rpc("bi_merge_entities", { p_from: S.brandSel, p_into: into }), "Birleştirildi"); S.brandSel = into; return render(); }
      if (a === "deleteBrand") { if (!confirm("Marka ve alternatif adları silinsin mi? Haberlerdeki ilişkiler de silinir. Geçici durdurmak için “İzleme etkin” kutusunu kapatın.")) return; await guard(() => del("bi_entities", "id=eq." + S.brandSel), "Silindi"); S.brandSel = null; return render(); }
      if (a === "addAlias") { const al = val("#newalias"); if (!al) return; await guard(() => insert("bi_entity_aliases", { entity_id: d.entity, alias: al, alias_norm: normAlias(al), lang: val("#newalang") || null, is_ambiguous: $("#newaamb").checked }, "return=minimal"), "Eklendi"); return render(); }
      if (a === "saveProv") {
        const g = k => document.querySelector('[data-prov="' + d.key + '"][data-k="' + k + '"]');
        let cfg; try { cfg = JSON.parse(g("config").value || "{}"); } catch (e) { return toast("Ayarlar geçerli JSON değil"); }
        await guard(() => patch("bi_providers", "key=eq." + d.key, { daily_quota: g("daily_quota").value === "" ? null : +g("daily_quota").value, min_interval_ms: +g("min_interval_ms").value || 0, config: cfg }), "Kaydedildi"); return;
      }
      if (a === "discover") {
        const sel = $("#discEnt"), url = val("#discUrl") || (sel.selectedOptions[0] && sel.selectedOptions[0].dataset.web) || "";
        if (!url) return toast("Adres gir veya web sitesi kayıtlı bir marka seç");
        $("#discOut").innerHTML = '<p class="muted">Aranıyor…</p>';
        const r = await guard(() => api("bi-admin", { fn: true, method: "POST", body: { action: "discover_feeds", url } }));
        $("#discOut").innerHTML = r.feeds.length ? '<p>Bulunan beslemeler:</p>' + r.feeds.map(f => '<div class="bar"><code class="grow">' + esc(f) + '</code><button class="btn sm" data-act="useFeed" data-url="' + esc(f) + '">Forma al</button></div>').join("") : '<p class="muted">Bu sayfada RSS/Atom bağlantısı bildirilmemiş. Haber odası sayfasını deneyin.</p>';
        return;
      }
      if (a === "useFeed") { $("#fUrl").value = d.url; const s2 = $("#discEnt"); if (s2.value) { $("#fEnt").value = s2.value; $("#fName").value = s2.selectedOptions[0].textContent + " haber odası"; } return; }
      if (a === "testFeed") { const url = val("#fUrl"); if (!url) return; $("#testOut").innerHTML = '<p class="muted">Deneniyor…</p>'; const r = await guard(() => api("bi-admin", { fn: true, method: "POST", body: { action: "test_feed", url } })); $("#testOut").innerHTML = '<p>' + r.items + ' öğe okundu.</p>' + r.sample.map(x => '<div class="muted">' + fd(x.published_at) + ' · ' + esc(x.title) + '</div>').join(""); return; }
      if (a === "addFeed") { const url = val("#fUrl"), name = val("#fName"); if (!url || !name) return toast("Adres ve ad gerekli"); await guard(() => insert("bi_feeds", { url, name, lang: val("#fLang") || null, entity_id: val("#fEnt") || null }, "return=minimal"), "Besleme eklendi"); return render(); }
      if (a === "addDomain") { const dm = val("#dNew").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""); if (!dm) return; await guard(() => insert("bi_sources?on_conflict=domain", { domain: dm, reliability: val("#dRel") }, "resolution=merge-duplicates,return=minimal"), "Eklendi"); return render(); }
      if (a === "saveSettings") {
        const st = Object.fromEntries((await api("bi_settings?select=*")).map(x => [x.key, x.value]));
        document.querySelectorAll("[data-set]").forEach(el => { const [k, f] = el.dataset.set.split("."); st[k] = st[k] || {}; st[k][f] = el.type === "checkbox" ? el.checked : +el.value; });
        const ws = st.weights; const sum = ws.brand + ws.segment + ws.source + ws.freshness;
        if (Math.abs(sum - 1) > 0.001) return toast("Ağırlıkların toplamı 1 olmalı (şu an " + sum.toFixed(2) + ")");
        if (!(st.thresholds.very_high > st.thresholds.high && st.thresholds.high > st.thresholds.medium)) return toast("Eşikler büyükten küçüğe sıralı olmalı");
        await guard(async () => { for (const k of ["thresholds", "weights", "publishing", "scan"]) await patch("bi_settings", "key=eq." + k, { value: st[k], updated_at: new Date().toISOString() }); }, "Kurallar kaydedildi"); return;
      }
      if (a === "addTerm") { const l = d.lang, inp = document.querySelector('[data-newterm="' + l + '"]'); if (!inp.value.trim()) return; await guard(() => insert("bi_query_terms", { lang: l, term: inp.value.trim(), kind: document.querySelector('[data-newkind="' + l + '"]').value }, "return=minimal"), "Eklendi"); return render(); }
      if (a === "previewQ") { $("#qOut").innerHTML = '<p class="muted">Hazırlanıyor…</p>'; const r = await guard(() => api("bi-admin", { fn: true, method: "POST", body: { action: "preview_queries" } })); $("#qOut").innerHTML = '<p>' + r.total + ' sorgu. Her tur sırayla bir dilim çalışır.</p><table><thead><tr><th>Dil</th><th>Tür</th><th>GDELT sorgusu</th></tr></thead><tbody>' + r.queries.map(q => '<tr><td>' + q.lang + '</td><td>' + q.family + '</td><td><code>' + esc(q.gdelt) + '</code></td></tr>').join("") + '</tbody></table>'; return; }
      if (a === "addStaff") { const id = val("#newStaff"); if (!/^[0-9a-f-]{36}$/i.test(id)) return toast("Geçerli bir kullanıcı kimliği gir"); await guard(() => insert("bi_staff", { user_id: id, role: val("#newRole") }, "return=minimal"), "Eklendi"); return render(); }
    } catch (e) { /* guard bildirdi */ }
  });
  document.addEventListener("change", async ev => {
    const el = ev.target, d = el.dataset;
    try {
      if (d.alias) await guard(() => patch("bi_entity_aliases", "id=eq." + d.alias, { [d.k]: el.checked }), "Kaydedildi");
      if (d.prov && d.k === "is_enabled") await guard(() => patch("bi_providers", "key=eq." + d.prov, { is_enabled: el.checked }), el.checked ? "Etkin" : "Kapatıldı");
      if (d.feed) await guard(() => patch("bi_feeds", "id=eq." + d.feed, { is_active: el.checked }), "Kaydedildi");
      if (d.dom) await guard(() => patch("bi_sources", "id=eq." + d.dom, { [d.k]: el.type === "checkbox" ? el.checked : el.value }), "Kaydedildi");
      if (d.lang && el.type === "checkbox") await guard(() => patch("bi_languages", "code=eq." + d.lang, { is_active: el.checked }), "Kaydedildi");
      if (d.staff) await guard(() => patch("bi_staff", "user_id=eq." + d.staff, { role: el.value }), "Rol güncellendi");
    } catch (e) { }
  });
  document.addEventListener("submit", async ev => {
    if (ev.target.id !== "bform") return;
    ev.preventDefault();
    const f = new FormData(ev.target), id = ev.target.dataset.id;
    const body = {
      name: f.get("name").trim(), slug: f.get("slug").trim(), entity_type: f.get("entity_type"), parent_id: f.get("parent_id") || null, parent_note: f.get("parent_note").trim() || null,
      country_iso2: f.get("country_iso2").trim().toUpperCase() || null, website: f.get("website").trim() || null, newsroom_url: f.get("newsroom_url").trim() || null,
      newsroom_feed_url: f.get("newsroom_feed_url").trim() || null, logo_url: f.get("logo_url").trim() || null, priority: +f.get("priority") || 3,
      product_families: list(f.get("product_families")), search_keywords: list(f.get("search_keywords")), exclusion_keywords: list(f.get("exclusion_keywords")),
      segments: f.getAll("segments"), languages: f.getAll("languages"), is_active: !!f.get("is_active"), logo_authorized: !!f.get("logo_authorized"), data_verified: !!f.get("data_verified"), notes: f.get("notes").trim() || null
    };
    try {
      if (id) await guard(() => patch("bi_entities", "id=eq." + id, body), "Marka kaydedildi");
      else {
        const r = await guard(() => insert("bi_entities", body), "Marka eklendi");
        S.brandSel = r[0].id;
        await insert("bi_entity_aliases", { entity_id: r[0].id, alias: body.name, alias_norm: normAlias(body.name) }, "return=minimal");
      }
      render();
    } catch (e) { }
  });
  // Motorla aynı normal form (supabase/functions/_shared/bi/text.ts → norm)
  function normAlias(s) {
    const F = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ç: "c", Ç: "c", ö: "o", Ö: "o", ü: "u", Ü: "u", ß: "ss", æ: "ae", ø: "o", å: "a", ł: "l", Ł: "l" };
    return s.replace(/[ıİşŞğĞçÇöÖüÜßæøåłŁ]/g, c => F[c] || c).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  async function boot() {
    if (!S.sess) return loginView();
    try { S.role = await whoami(); }
    catch (e) {
      if (e.status === 401) { sessionStorage.removeItem("bi_admin_sess"); S.sess = null; return loginView("Oturum süresi doldu."); }
      S.role = null;
      if (e.status === 404 || e.code === "PGRST205" || e.code === "42P01") { shell('<div class="notice">Brand Intelligence tabloları bu Supabase projesinde henüz kurulu değil. Kurulum adımları: <code>docs/brand-intelligence/README.md</code>.</div>'); return; }
    }
    if (!S.role) { sessionStorage.removeItem("bi_admin_sess"); S.sess = null; return loginView("Bu hesap Brand Intelligence ekibinde değil."); }
    render();
  }
  window.BIAdmin = { state: S };
  boot();
})();
