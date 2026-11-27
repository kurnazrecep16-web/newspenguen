/* NEWSPENGUEN · konuya göre haber görselleri
   Telifli fotoğraf yerine, haberin konusunu gösteren gece tonlu vektör sahneler.
   topicOf(item) haberin başlık, şirket ve özetinden konuyu bulur; sceneSVG(topic, key) sahneyi çizer. */
(function () {
  const lc = s => String(s || "").toLocaleLowerCase("tr");
  // Sıra önemli: ilk eşleşen konu kazanır (ör. "demiryolu ... köprü ve tünel" → demiryolu)
  const TOPICS = [
    ["rail", /demir ?yolu|demiryol|hızlı tren|\btren|raylı|metro|tramvay|marmaray|inrail|railway|\brail|high-speed/],
    ["airport", /havaliman|havaalan|airport|pist /],
    ["offshore", /offshore|açık deniz rüzgar|monopil|deniz üstü rüzgar|floating wind/],
    ["wind", /rüzgar|\bres\b|\bres |wind|türbin|turbine/],
    ["solar", /güneş|\bges\b|\bges |solar|fotovoltaik|\bpv\b|yeka ges/],
    ["refinery", /rafineri|petrokimya|refinery|petrochem|\blng\b|lpg|aromatik|kimya tesisi|methanol|metanol|amonyak|ammonia|hidrojen|hydrogen/],
    ["pipeline", /boru hattı|pipeline|doğal ?gaz iletim|tanap|botaş/],
    ["grid", /\bkv\b|enerji iletim|iletim hattı|trafo|substation|transmission|şebeke|teiaş|dağıtım hattı/],
    ["plant", /santral|termik|\bhes\b|baraj|nükleer|akkuyu|power plant|kojenerasyon|\bdam\b|hydro/],
    ["port", /liman|rıhtım|konteyner|\bport\b|marina|iskele|container terminal/],
    ["ship", /tersane|gemi|shipyard|vessel|\bship|feribot|yat inşa|römorkör|tanker|filo|denizcilik|maritime|tugboat/],
    ["bridge", /köprü|viyadük|bridge|viaduct/],
    ["tunnel", /tünel|tunnel/],
    ["water", /atık ?su|arıtma|içme suyu|yağmur suyu|dere ıslah|wastewater|desalin|isk[iİ]|aski|izsu|kanalizasyon/],
    ["road", /otoyol|kavşak|karayolu|çevre yolu|bulvar|highway|motorway|yol inşa|bağlantı yolu|kara yolu/],
    ["building", /konut|toki|mahalle|rezidans|otel|hotel|hastane|hospital|okul|kampüs|ofis|avm|itfaiye|bina|stadyum|müze|kentsel dönüşüm|cami|apartman|villa|yurt/],
    ["steel", /demir ?çelik|çelik üretim|haddehane|steel mill|steelmaker|çelik fabrika|döküm/],
    ["factory", /fabrika|\bosb\b|organize sanayi|tesis|üretim|factory|plant|çimento|cement|sanayi/],
    ["tank", /tank|depolama|storage|silo|terminal/]
  ];
  const SEG_FALLBACK = { marine: "ship", energy: "grid", deco: "building", powder: "factory", prot: "factory" };
  function topicOf(i) {
    const a = lc((i.company || "") + " " + (i.title || "")), b = lc(i.summary || "");
    for (const t of [a, b]) for (const [k, rx] of TOPICS) if (rx.test(t)) return k;
    return SEG_FALLBACK[i.seg] || "factory";
  }
  const TOPIC_LABEL = { rail: "Demiryolu", airport: "Havalimanı", offshore: "Offshore rüzgar", wind: "Rüzgar", solar: "Güneş", refinery: "Rafineri", pipeline: "Boru hattı", grid: "Enerji iletimi", plant: "Santral", port: "Liman", ship: "Tersane", bridge: "Köprü", tunnel: "Tünel", water: "Su altyapısı", road: "Karayolu", building: "Yapı", steel: "Çelik", factory: "Sanayi tesisi", tank: "Depolama" };

  function h32(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function rnd(seed) { let x = seed || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296; }

  // Gökyüzü paletleri: alacakaranlık (konseptteki gün batımı), gece, şafak
  const SKIES = [
    ["#0A1A3F", "#1C3F8F", "#E07A3A", "#F7B15A"],
    ["#050D24", "#0E2458", "#3A5DB8", "#7FA6F0"],
    ["#0B1638", "#26407E", "#B86A8C", "#F2A86B"]
  ];
  const INK = "#07112B", INK2 = "#0C1B40", RIM = "#5B8CFF", LIT = "#FFD37A";

  function sky(id, p, R, horizon = 150) {
    let s = '<defs><linearGradient id="s' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset=".45" stop-color="' + p[1] + '"/><stop offset=".8" stop-color="' + p[2] + '"/><stop offset="1" stop-color="' + p[3] + '"/></linearGradient>' +
      '<linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + INK2 + '"/><stop offset="1" stop-color="' + INK + '"/></linearGradient>' +
      '<linearGradient id="w' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[2] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + INK + '"/></linearGradient>' +
      '<radialGradient id="h' + id + '" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="' + p[3] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + p[3] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="240" fill="url(#s' + id + ')"/><rect y="40" width="400" height="' + horizon + '" fill="url(#h' + id + ')"/>';
    for (let k = 0; k < 18; k++) s += '<circle cx="' + (R() * 400).toFixed(0) + '" cy="' + (R() * 70).toFixed(0) + '" r="' + (R() * .9 + .3).toFixed(1) + '" fill="#fff" opacity="' + (R() * .5 + .2).toFixed(2) + '"/>';
    const sx = 60 + R() * 280;
    s += '<circle cx="' + sx.toFixed(0) + '" cy="' + (horizon - 10) + '" r="22" fill="' + p[3] + '" opacity=".55"/>';
    return s;
  }
  const hills = (id, y, amp, col) => '<path d="M0 ' + y + ' C80 ' + (y - amp) + ' 140 ' + (y + amp * .4) + ' 220 ' + (y - amp * .6) + ' S360 ' + (y - amp) + ' 400 ' + (y - amp * .2) + ' V240 H0Z" fill="' + col + '"/>';
  const water = id => '<rect y="170" width="400" height="70" fill="url(#w' + id + ')"/>' + [180, 192, 206, 222].map((y, k) => '<path d="M' + (20 + k * 30) + ' ' + y + 'h' + (60 - k * 6) + 'M' + (220 - k * 10) + ' ' + y + 'h' + (50 + k * 4) + '" stroke="#fff" stroke-opacity=".12" stroke-width="1.2"/>').join("");
  const lights = (R, x, y, w, h, n, col = LIT) => { let s = ""; for (let k = 0; k < n; k++) s += '<rect x="' + (x + R() * w).toFixed(1) + '" y="' + (y + R() * h).toFixed(1) + '" width="2.4" height="2.4" fill="' + col + '" opacity="' + (R() * .5 + .5).toFixed(2) + '"/>'; return s; };

  const DRAW = {
    rail(id, R) {
      let s = hills(id, 168, 18, "#0E1F4A");
      s += '<path d="M0 196 L400 150 L400 166 L0 214Z" fill="#13275A"/><path d="M0 196 L400 150" stroke="' + RIM + '" stroke-width="1.5" opacity=".7"/>';
      for (let x = 30; x < 400; x += 60) { const y = 196 - x * .115; s += '<path d="M' + x + ' ' + (y + 2) + 'V' + (y - 46) + 'h18" stroke="#2A3F78" stroke-width="2.5" fill="none"/>'; }
      s += '<path d="M0 154 L400 108" stroke="#8FB0FF" stroke-opacity=".5" stroke-width="1"/>';
      // hızlı tren
      s += '<g transform="translate(70 0) rotate(-6.6 140 170)"><path d="M20 176 H230 C262 176 286 170 300 160 C286 152 262 148 236 148 H20Z" fill="#E8EEF8"/><path d="M20 168 H246 C268 168 284 165 296 160" stroke="' + "#1E6BFF" + '" stroke-width="5" fill="none"/><path d="M232 151 C254 151 272 154 286 158 L262 160 C252 156 242 154 232 154Z" fill="#0B1A3A"/>' +
        Array.from({ length: 8 }, (_, k) => '<rect x="' + (30 + k * 25) + '" y="154" width="16" height="7" rx="2" fill="#0B1A3A"/>').join("") + '<path d="M20 176 H230" stroke="#9AA8C3" stroke-width="2"/><circle cx="292" cy="162" r="2.5" fill="#FFF2B0"/></g>';
      s += '<path d="M0 214 L400 166 V240 H0Z" fill="' + INK + '"/>';
      return s;
    },
    bridge(id, R) {
      let s = hills(id, 150, 22, "#102352") + water(id);
      const cy = x => x <= 110 ? 150 - (x / 110) * 88 : x <= 300 ? 62 + (1 - Math.pow((x - 205) / 95, 2)) * 82 : 62 + ((x - 300) / 100) * 88;
      for (let x = 6; x < 400; x += 10) { const y = cy(x); if (y < 152) s += '<path d="M' + x + ' ' + y.toFixed(1) + ' V154" stroke="#C9D6F2" stroke-opacity=".45" stroke-width=".8"/>'; }
      s += '<path d="M0 150 L110 62 Q205 226 300 62 L400 150" stroke="#E6ECF8" stroke-width="2" fill="none"/>';
      s += '<path d="M0 156 H400" stroke="#C9D6F2" stroke-width="5"/><path d="M0 160 H400" stroke="#0B1A3A" stroke-width="3"/>';
      [110, 300].forEach(x => { s += '<path d="M' + (x - 6) + ' 205 V58 M' + (x + 6) + ' 205 V58" stroke="#D7E1F5" stroke-width="5"/><path d="M' + (x - 8) + ' 92 H' + (x + 8) + ' M' + (x - 8) + ' 130 H' + (x + 8) + '" stroke="#D7E1F5" stroke-width="3"/><circle cx="' + x + '" cy="56" r="2" fill="#FF6B57"/>'; });
      s += lights(R, 0, 150, 400, 4, 24, "#FFE6A3");
      return s;
    },
    tunnel(id, R) {
      let s = '<path d="M0 200 C60 90 140 70 220 90 S360 120 400 160 V240 H0Z" fill="#13275A"/><path d="M0 200 C60 90 140 70 220 90" stroke="' + RIM + '" stroke-opacity=".5" fill="none"/>';
      s += '<path d="M150 214 V170 A50 50 0 0 1 250 170 V214Z" fill="#0A1330"/><path d="M150 214 V170 A50 50 0 0 1 250 170 V214" stroke="#9FB4E0" stroke-width="6" fill="none"/>';
      s += '<path d="M160 214 V172 A40 40 0 0 1 240 172 V214Z" fill="url(#h' + id + ')" opacity=".9"/>';
      s += '<path d="M0 240 L170 214 H230 L400 240Z" fill="#1A2B55"/><path d="M200 240 L200 214" stroke="#FFD37A" stroke-dasharray="6 6" stroke-width="2"/>';
      s += '<path d="M40 240 L185 214 M360 240 L215 214" stroke="#FF6B57" stroke-opacity=".6" stroke-width="2"/>';
      return s;
    },
    road(id, R) {
      let s = hills(id, 160, 16, "#102352");
      s += '<path d="M-20 240 C120 170 220 170 420 120" stroke="#1C2E5E" stroke-width="34" fill="none"/><path d="M-20 240 C120 170 220 170 420 120" stroke="#FFD37A" stroke-opacity=".8" stroke-width="2" stroke-dasharray="10 8" fill="none"/>';
      s += '<path d="M60 240 C140 190 160 140 260 120 S380 140 420 200" stroke="#22356A" stroke-width="26" fill="none"/><path d="M60 240 C140 190 160 140 260 120 S380 140 420 200" stroke="#FF6B57" stroke-opacity=".7" stroke-width="2" fill="none"/>';
      for (let x = 70; x < 380; x += 70) s += '<path d="M' + x + ' 150 v-36 h10" stroke="#2A3F78" stroke-width="2" fill="none"/><circle cx="' + (x + 10) + '" cy="114" r="2" fill="#FFE6A3"/>';
      return s;
    },
    port(id, R) {
      let s = water(id) + '<rect y="150" width="400" height="22" fill="#14285C"/>';
      for (let k = 0; k < 26; k++) { const x = 10 + (k % 13) * 22, y = 132 - Math.floor(k / 13) * 10; s += '<rect x="' + x + '" y="' + (y + 8) + '" width="20" height="9" fill="' + ["#1E6BFF", "#E0663A", "#2DB37A", "#C9D6F2", "#F5A623"][Math.floor(R() * 5)] + '" opacity=".85"/>'; }
      [300, 355].forEach(x => { s += '<path d="M' + x + ' 150 V70 M' + (x + 24) + ' 150 V70 M' + (x - 40) + ' 74 H' + (x + 40) + '" stroke="#D7E1F5" stroke-width="4" fill="none"/><path d="M' + x + ' 100 L' + (x + 24) + ' 74 M' + (x + 24) + ' 100 L' + x + ' 74" stroke="#D7E1F5" stroke-width="1.5"/><rect x="' + (x - 30) + '" y="76" width="10" height="8" fill="#1E6BFF"/>'; });
      s += '<path d="M40 176 H260 L246 196 H56Z" fill="#0E1A3C"/><rect x="200" y="160" width="40" height="16" fill="#D7E1F5"/>';
      s += lights(R, 0, 146, 400, 6, 14, "#FFE6A3");
      return s;
    },
    ship(id, R) {
      let s = water(id) + hills(id, 165, 12, "#0F2150");
      s += '<path d="M50 150 H330 L312 190 H74Z" fill="#B3262E"/><path d="M50 150 H330 L326 160 H54Z" fill="#0E1A3C"/><rect x="250" y="112" width="58" height="38" fill="#E8EEF8"/><rect x="262" y="96" width="30" height="16" fill="#E8EEF8"/><rect x="284" y="78" width="8" height="18" fill="#22356A"/>';
      s += Array.from({ length: 6 }, (_, k) => '<rect x="' + (70 + k * 30) + '" y="132" width="26" height="18" fill="' + ["#1E6BFF", "#2DB37A", "#F5A623"][k % 3] + '"/>').join("") + lights(R, 254, 116, 50, 8, 6);
      s += '<path d="M360 190 V40 M330 46 H400 M360 60 L392 46" stroke="#D7E1F5" stroke-width="4" fill="none"/><path d="M376 46 V96" stroke="#D7E1F5" stroke-width="1"/>';
      return s;
    },
    offshore(id, R) {
      let s = water(id);
      [[90, 1], [210, .75], [310, .55], [370, .4]].forEach(([x, k]) => { const top = 170 - 120 * k; s += '<path d="M' + x + ' 182 V' + top + '" stroke="#E8EEF8" stroke-width="' + (4 * k + 1) + '"/><rect x="' + (x - 6 * k) + '" y="176" width="' + 12 * k + '" height="10" fill="#F5C518"/>' + blades(x, top, 52 * k, R() * 120); });
      return s;
    },
    wind(id, R) {
      let s = hills(id, 165, 30, "#13275A") + hills(id, 190, 14, INK);
      [[80, 1], [190, .8], [290, .62], [360, .5]].forEach(([x, k]) => { const base = 170 - k * 10, top = base - 110 * k; s += '<path d="M' + x + ' ' + base + ' V' + top + '" stroke="#E8EEF8" stroke-width="' + (4 * k + 1) + '"/>' + blades(x, top, 50 * k, R() * 120); });
      return s;
    },
    solar(id, R) {
      let s = hills(id, 150, 10, "#102352");
      for (let r = 0; r < 5; r++) { const y = 150 + r * 18, sk = 1 + r * .35; for (let c = -2; c < 9; c++) { const x = 200 + (c - 3) * 52 * sk; s += '<path d="M' + x + ' ' + (y + 12 * sk) + ' L' + (x + 44 * sk) + ' ' + (y + 12 * sk) + ' L' + (x + 40 * sk) + ' ' + y + ' L' + (x + 4 * sk) + ' ' + y + 'Z" fill="#1747B8" stroke="#7FA6F0" stroke-opacity=".6" stroke-width=".8"/><path d="M' + (x + 22 * sk) + ' ' + y + ' V' + (y + 12 * sk) + '" stroke="#7FA6F0" stroke-opacity=".4" stroke-width=".6"/>'; } }
      return s;
    },
    refinery(id, R) {
      let s = hills(id, 175, 8, INK2);
      [[60, 70, 14], [100, 90, 18], [140, 60, 12], [250, 100, 20], [300, 74, 14]].forEach(([x, h, w]) => { s += '<rect x="' + x + '" y="' + (175 - h) + '" width="' + w + '" height="' + h + '" rx="' + w / 2 + '" fill="#13275A" stroke="' + RIM + '" stroke-opacity=".5"/>' + lights(R, x + 2, 175 - h + 6, w - 4, h - 10, 4); });
      s += '<path d="M180 175 V50" stroke="#2A3F78" stroke-width="4"/><path d="M180 50 c-6 -10 4 -16 0 -26 c10 8 10 18 0 26" fill="#FF9A3C"/><path d="M180 48 c-3 -6 2 -9 0 -14 c5 5 5 9 0 14" fill="#FFE07A"/>';
      s += '<path d="M40 150 H360 M40 160 H360" stroke="#2A3F78" stroke-width="2"/><path d="M200 130 h40 v45 M210 120 h50" stroke="#2A3F78" stroke-width="3" fill="none"/>';
      s += '<rect y="175" width="400" height="65" fill="' + INK + '"/>' + lights(R, 30, 140, 340, 30, 30);
      return s;
    },
    tank(id, R) {
      let s = hills(id, 175, 8, INK2);
      [[60, 70, 55], [150, 90, 70], [260, 76, 60]].forEach(([x, w, h]) => { s += '<rect x="' + x + '" y="' + (180 - h) + '" width="' + w + '" height="' + h + '" fill="#C9D6F2"/><ellipse cx="' + (x + w / 2) + '" cy="' + (180 - h) + '" rx="' + w / 2 + '" ry="6" fill="#E8EEF8"/><path d="M' + x + ' ' + (180 - h * .6) + ' h' + w + '" stroke="#9AA8C3"/>'; });
      s += '<path d="M150 120 l40 -30 h20" stroke="#2A3F78" stroke-width="2" fill="none"/><rect y="180" width="400" height="60" fill="' + INK + '"/>';
      return s;
    },
    pipeline(id, R) {
      let s = hills(id, 150, 26, "#13275A") + hills(id, 185, 12, INK2);
      s += '<path d="M-10 214 C100 200 160 176 240 172 S360 150 420 140" stroke="#C9D6F2" stroke-width="10" fill="none"/><path d="M-10 214 C100 200 160 176 240 172 S360 150 420 140" stroke="#7F8FB0" stroke-width="2" fill="none" transform="translate(0 4)"/>';
      for (let x = 20; x < 400; x += 50) s += '<rect x="' + x + '" y="' + (212 - x * .17) + '" width="6" height="16" fill="#2A3F78"/>';
      return s;
    },
    grid(id, R) {
      let s = hills(id, 175, 14, "#102352");
      const tower = (x, k) => { const b = 200 - (1 - k) * 40, t = b - 130 * k, w = 22 * k; return '<path d="M' + (x - w) + ' ' + b + ' L' + x + ' ' + t + ' L' + (x + w) + ' ' + b + ' M' + (x - w * .6) + ' ' + (t + 50 * k) + ' L' + (x + w * .6) + ' ' + (t + 50 * k) + ' M' + (x - w * 1.4) + ' ' + (t + 22 * k) + ' H' + (x + w * 1.4) + ' M' + (x - w) + ' ' + (t + 40 * k) + ' H' + (x + w) + ' M' + (x - w * .8) + ' ' + b + ' L' + (x + w * .4) + ' ' + (t + 50 * k) + ' M' + (x + w * .8) + ' ' + b + ' L' + (x - w * .4) + ' ' + (t + 50 * k) + '" stroke="#C9D6F2" stroke-width="' + (1.8 * k + .6) + '" fill="none"/>'; };
      s += tower(90, 1) + tower(250, .7) + tower(350, .5);
      s += '<path d="M60 92 Q170 130 230 125 Q300 140 336 140 M120 92 Q190 128 270 125 Q320 140 364 140 M70 110 Q170 150 236 143 Q300 156 340 155" stroke="#E6ECF8" stroke-opacity=".7" fill="none"/>';
      return s;
    },
    plant(id, R) {
      let s = hills(id, 180, 10, INK2);
      s += '<path d="M60 190 C70 140 66 110 58 80 H122 C114 110 110 140 120 190Z" fill="#C9D6F2"/><path d="M58 80 H122" stroke="#E8EEF8" stroke-width="3"/>';
      s += '<path d="M70 78 c-10 -20 20 -24 10 -44 c26 6 30 30 14 44" fill="#E8EEF8" opacity=".45"/>';
      s += '<rect x="150" y="120" width="120" height="70" fill="#13275A" stroke="' + RIM + '" stroke-opacity=".4"/><rect x="290" y="60" width="12" height="130" fill="#C9D6F2"/><rect x="290" y="70" width="12" height="6" fill="#E0663A"/><rect x="290" y="90" width="12" height="6" fill="#E0663A"/>' + lights(R, 156, 128, 108, 50, 16);
      s += '<rect y="190" width="400" height="50" fill="' + INK + '"/>';
      return s;
    },
    factory(id, R) {
      let s = hills(id, 175, 10, INK2);
      let x = 30; s += '<path d="M30 180 V130 ' + Array.from({ length: 6 }, (_, k) => 'L' + (30 + k * 40 + 40) + ' 110 V130').join(" ") + ' V180Z" fill="#13275A" stroke="' + RIM + '" stroke-opacity=".5"/>';
      s += Array.from({ length: 6 }, (_, k) => '<path d="M' + (30 + k * 40 + 40) + ' 112 L' + (30 + k * 40 + 6) + ' 128" stroke="#8FB0FF" stroke-opacity=".5" stroke-width="3"/>').join("");
      s += '<rect x="290" y="70" width="14" height="110" fill="#22356A"/><rect x="320" y="90" width="12" height="90" fill="#22356A"/><path d="M297 68 c-8 -14 14 -18 6 -34 c18 6 20 24 8 34" fill="#C9D6F2" opacity=".35"/>';
      s += '<rect x="250" y="140" width="130" height="40" fill="#0F2150" stroke="' + RIM + '" stroke-opacity=".4"/>' + lights(R, 40, 140, 330, 34, 26);
      s += '<rect y="180" width="400" height="60" fill="' + INK + '"/>';
      return s;
    },
    steel(id, R) {
      let s = hills(id, 180, 8, INK2);
      for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) { const x = 70 + c * 55, y = 180 - (r + 1) * 36; s += '<rect x="' + x + '" y="' + y + '" width="55" height="36" fill="none" stroke="#C9D6F2" stroke-width="3"/><path d="M' + x + ' ' + y + ' L' + (x + 55) + ' ' + (y + 36) + '" stroke="#C9D6F2" stroke-opacity=".4"/>'; }
      s += '<path d="M360 180 V30 M330 34 H400 M360 46 L392 34" stroke="#F5A623" stroke-width="4" fill="none"/><path d="M380 34 V70" stroke="#F5A623" stroke-width="1"/><rect y="180" width="400" height="60" fill="' + INK + '"/>';
      return s;
    },
    building(id, R) {
      let s = "";
      const blocks = [[20, 70, 90], [70, 50, 130], [125, 60, 105], [190, 46, 150], [240, 64, 115], [308, 50, 135], [356, 44, 95]];
      blocks.forEach(([x, w, h]) => { s += '<rect x="' + x + '" y="' + (195 - h) + '" width="' + w + '" height="' + h + '" fill="#112456" stroke="' + RIM + '" stroke-opacity=".35"/>'; for (let yy = 195 - h + 8; yy < 188; yy += 10) for (let xx = x + 6; xx < x + w - 6; xx += 9) if (R() > .45) s += '<rect x="' + xx + '" y="' + yy + '" width="4" height="5" fill="' + LIT + '" opacity="' + (R() * .5 + .4).toFixed(2) + '"/>'; });
      s += '<path d="M190 45 V40 M213 45 V28" stroke="#C9D6F2" stroke-width="2"/><circle cx="213" cy="27" r="2" fill="#FF6B57"/><rect y="195" width="400" height="45" fill="' + INK + '"/>';
      return s;
    },
    airport(id, R) {
      let s = hills(id, 180, 6, INK2);
      s += '<rect x="40" y="120" width="16" height="60" fill="#22356A"/><path d="M30 104 h36 l-6 16 h-24z" fill="#C9D6F2"/><rect x="90" y="150" width="200" height="30" fill="#13275A"/>' + lights(R, 96, 156, 188, 18, 16);
      s += '<g transform="translate(230 70) rotate(-12)"><path d="M0 20 H110 C124 20 130 14 132 10 C128 6 120 4 110 4 H10Z" fill="#E8EEF8"/><path d="M50 12 L90 -18 H100 L76 12Z M50 14 L80 40 H90 L70 14Z M8 6 L0 -12 H8 L22 6Z" fill="#C9D6F2"/></g>';
      s += '<path d="M0 205 L400 190 V200 L0 215Z" fill="#1A2B55"/><path d="M0 210 L400 195" stroke="#fff" stroke-dasharray="14 10" stroke-opacity=".7"/><rect y="215" width="400" height="25" fill="' + INK + '"/>';
      return s;
    },
    water(id, R) {
      let s = hills(id, 165, 12, "#102352");
      [[90, 175, 60], [220, 182, 70], [340, 172, 46]].forEach(([x, y, r]) => { s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + r * .28 + '" fill="#1747B8" stroke="#C9D6F2" stroke-width="3"/><path d="M' + (x - r) + ' ' + y + ' H' + (x + r) + '" stroke="#7FA6F0" stroke-opacity=".6"/>'; });
      s += '<rect x="140" y="110" width="70" height="40" fill="#13275A" stroke="' + RIM + '" stroke-opacity=".4"/>' + lights(R, 146, 116, 58, 26, 6) + '<rect y="200" width="400" height="40" fill="' + INK + '"/>';
      return s;
    }
  };
  function blades(x, y, len, a) {
    let s = "";
    for (let k = 0; k < 3; k++) { const t = (a + k * 120) * Math.PI / 180; s += '<path d="M' + x + ' ' + y + ' L' + (x + Math.cos(t) * len).toFixed(1) + ' ' + (y + Math.sin(t) * len).toFixed(1) + '" stroke="#E8EEF8" stroke-width="' + Math.max(1.2, len / 18).toFixed(1) + '" stroke-linecap="round"/>'; }
    return s + '<circle cx="' + x + '" cy="' + y + '" r="' + Math.max(1.5, len / 16).toFixed(1) + '" fill="#E8EEF8"/>';
  }

  let uid = 0;
  function sceneSVG(topic, key) {
    const h = h32(key + topic), R = rnd(h), id = "n" + (uid++).toString(36);
    const p = SKIES[h % SKIES.length];
    const horizonByTopic = { offshore: 170, ship: 165, port: 150, bridge: 150 };
    const body = (DRAW[topic] || DRAW.factory)(id, R);
    return '<svg class="scene" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + sky(id, p, R, horizonByTopic[topic] || 150) + body + '</svg>';
  }
  window.NPScenes = { topicOf, sceneSVG, TOPIC_LABEL };
})();
