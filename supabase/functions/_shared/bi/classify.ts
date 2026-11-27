// Kural tabanlı, şeffaf sınıflandırma. Her karar metinden birebir kanıtla döner.
// (İsteğe bağlı LLM aşaması ileride bu sonucun üstüne eklenebilir; burada tahmin uydurulmaz.)
import type { SegmentKey, TopicCode } from "./types.ts";
import { fold, snippetAround } from "./text.ts";

type Rule = { rx: RegExp; label: string };
const R = (src: string, label = "") => ({ rx: new RegExp(src, "iu"), label });

// Boya / kaplama bağlamı (10 dil). Tek başına marka adı bağlam sayılmaz.
const COATINGS = new RegExp([
  "coating", "paint(s|ing)?\\b", "primer", "varnish", "lacquer", "anti-?corrosi", "antifoul", "intumescent", "fireproofing", "powder coat",
  "boya", "kaplama", "vernik", "astar", "antikoroz", "korozyon", "epoks", "poliuretan", "toz boya", "elektrostatik",
  "beschichtung", "farbe(n)?\\b", "lack(e)?\\b", "korrosionsschutz", "pulverlack",
  "peinture", "revetement", "vernis", "anticorrosion",
  "vernic", "rivestiment", "pittur",
  "pintura", "recubrimiento", "barniz",
  "\\bverf\\b", "verven", "\\blak\\b",
  "tinta(s)?\\b", "revestimento",
  "farb(a|y)\\b", "powlok", "lakier",
  "涂料", "油漆", "涂层", "塗料",
].join("|"), "iu");

export function coatingsContext(text: string): { present: boolean; evidence: string | null } {
  const f = fold(text);
  const m = COATINGS.exec(f);
  return m ? { present: true, evidence: snippetAround(text, m.index, m[0].length, 50) } : { present: false, evidence: null };
}

// Beş ana segment. Endüstriyel → Protective; mimari → Decorative. Otomotiv ayrı segment değildir.
const SEG_RULES: Record<SegmentKey, Rule[]> = {
  marine: [
    R("marine coat|antifoul|hull (coat|paint|clean)|shipyard|ship ?build|newbuild|dry ?dock|vessel|fouling release|yacht paint", "marine"),
    R("gemi|tersane|karina|yat boya|deniz", "denizcilik"),
    R("schiff|werft|navire|chantier naval|navale|astillero|scheepswerf|stocznia|船舶|船厂", "marine (yerel)"),
  ],
  protective: [
    R("protective coat|industrial coat|heavy[- ]duty|anti-?corrosi|corrosion protection|intumescent|passive fire|fireproof|steel (structure|bridge)|bridge|infrastructure|tank lining|pipeline coat|petrochem|refiner", "protective"),
    R("endustriyel boya|koruyucu boya|korozyon|antikoroz|yangin (yalitim|koruma)|celik konstruksiyon|kopru|altyapi|rafineri", "protective (TR)"),
    R("korrosionsschutz|industrielack|stahlbau|brucke|anticorrosion|protection incendie|anticorrosiv|industrial|przemysl|防腐|重防腐|工业涂料", "protective (yerel)"),
  ],
  powder: [
    R("powder coat|pulverlack|peinture (en )?poudre|vernici in polvere|pintura en polvo|poedercoat|farby proszkowe|tinta em po|粉末涂料", "powder"),
    R("toz boya|elektrostatik", "toz boya (TR)"),
  ],
  decorative: [
    R("decorative (paint|coat)|architectural (paint|coat)|interior paint|exterior paint|wall paint|\\bdiy\\b|paint store|colou?r of the year|home improvement", "decorative"),
    R("dekoratif|ic cephe|dis cephe|duvar boya|yilin rengi|ev boya", "dekoratif (TR)"),
    R("wandfarbe|fassadenfarbe|peinture decorative|pittura decorativa|pintura decorativa|muurverf|farby dekoracyjne|建筑涂料|墙面漆", "decorative (yerel)"),
  ],
  energy: [
    R("wind (farm|turbine|energy|power)|offshore wind|solar|photovoltaic|\\bpv\\b|power plant|nuclear|hydrogen|\\blng\\b|oil (and|&) gas|offshore platform|substation|transmission tower|battery plant", "energy"),
    R("ruzgar|res projesi|ges projesi|gunes enerji|enerji santral|nukleer|hidrojen|dogalgaz|trafo", "enerji (TR)"),
    R("windpark|windkraft|eolien|eolico|eolica|energia (eolica|solare|solar)|erneuerbare energie|风电|海上风电|光伏", "enerji (yerel)"),
  ],
};

export type SegmentHit = { key: SegmentKey; score: number; evidence: string[] };

export function classifySegments(text: string, entitySegments: string[] = []): SegmentHit[] {
  const f = fold(text);
  const res: SegmentHit[] = [];
  for (const key of Object.keys(SEG_RULES) as SegmentKey[]) {
    let hits = 0;
    const ev: string[] = [];
    for (const r of SEG_RULES[key]) {
      const m = r.rx.exec(f);
      if (m) { hits++; if (ev.length < 2) ev.push(snippetAround(text, m.index, m[0].length, 50)); }
    }
    if (hits) res.push({ key, score: Math.min(100, 55 + hits * 20), evidence: ev });
  }
  // Metinde segment işareti yoksa ve marka tek segmentliyse o segment düşük puanla önerilir (editör onayı gerekir)
  if (!res.length && entitySegments.length === 1) {
    res.push({ key: entitySegments[0] as SegmentKey, score: 35, evidence: [] });
  }
  return res.sort((a, b) => b.score - a.score);
}

// İş konuları (A–O)
const TOPIC_RULES: [TopicCode, RegExp][] = [
  ["E", /acqui|merger|takeover|buyout|divest|satin al|birlesme|devral|ubernahme|fusion|rachat|acquisizion|adquisici|overname|przejeci|aquisic|收购|并购/iu],
  ["B", /new (plant|factory|facility)|factor(y|ies)|production (plant|site|facility)|capacity|expan|production line|groundbreak|inaugurat|fabrika|tesis|kapasite|uretim hatt|temel at|acilis|neues werk|kapazitat|nouvelle usine|stabiliment|nueva planta|nieuwe fabriek|nowa fabryka|nova fabrica|新工厂|扩产|产能/iu],
  ["A", /invest|capex|yatirim|investition|investissement|investiment|inversion|investering|inwestycj|投资/iu],
  ["C", /launch|introduc|unveil|new (product|range|coating|paint)|yeni urun|lansman|tanitti|neues produkt|nouveau produit|nuovo prodotto|nuevo producto|nieuw product|nowy produkt|novo produto|新品|推出/iu],
  ["D", /technolog|innovat|r ?& ?d|research|patent|graphene|nano|self-healing|digital|teknoloji|inovasyon|ar-?ge|innovation|tecnolog|innowac|技术|创新/iu],
  ["F", /partner|agreement|distribut|joint venture|collaborat|mou\b|ortaklik|anlasma|distributor|bayi|is birligi|kooperation|partenariat|accordo|acuerdo|samenwerking|umowa|parceria|合作|协议/iu],
  ["M", /sustainab|carbon|emission|low[- ]voc|\bvoc\b|bio-?based|recycl|circular|net zero|esg|surdurulebil|karbon|emisyon|geri donusum|nachhaltig|durable|sostenib|duurzaam|zrownowaz|可持续|低碳/iu],
  ["N", /results|revenue|sales|profit|earnings|quarter|guidance|ceo|appoint|dividend|ipo|financial|ciro|kar\b|gelir|ceyrek|atandi|genel mudur|umsatz|chiffre d.affaires|fatturato|ingresos|omzet|przychod|营收|利润/iu],
  ["G", /project|contract|tender|awarded|supplied|reference|proje|ihale|sozlesme|projekt|projet|progetto|proyecto|project|projeto|项目|合同/iu],
];

export function classifyTopics(text: string, segments: SegmentKey[], brandIsMain: boolean): { codes: TopicCode[]; evidence: Record<string, string> } {
  const f = fold(text);
  const codes: TopicCode[] = [];
  const evidence: Record<string, string> = {};
  for (const [code, rx] of TOPIC_RULES) {
    const m = rx.exec(f);
    if (m) { codes.push(code); evidence[code] = snippetAround(text, m.index, m[0].length, 40); }
  }
  // Proje referansı segmentle birleşir: H marine, I protective, L energy
  if (codes.includes("G")) {
    if (segments.includes("marine")) codes.push("H");
    if (segments.includes("protective")) codes.push("I");
  }
  if (segments.includes("powder") && codes.some((c) => "ABCDEF".includes(c))) codes.push("J");
  if (segments.includes("decorative") && codes.some((c) => "ABCDEF".includes(c))) codes.push("K");
  if (segments.includes("energy")) codes.push("L");
  if (!brandIsMain) return { codes: ["O", ...new Set(codes)].filter((c, i, a) => a.indexOf(c) === i) as TopicCode[], evidence };
  return { codes: [...new Set(codes)], evidence };
}

// İçerik türü: resmi haber odası / basın bülteni / görüş / sponsorlu
export function contentType(text: string, fromOfficialSource: boolean): { type: "news" | "press_release" | "opinion" | "sponsored" | "unknown"; promotional: boolean } {
  const f = fold(text);
  if (/sponsored|advertorial|paid (post|content)|reklam|sponsorlu|anzeige|publi-?redazionale|contenido patrocinado/.test(f)) return { type: "sponsored", promotional: true };
  if (/\bopinion\b|op-ed|column|commentary|gorus|kose yazisi|kommentar|tribune|editorial/.test(f)) return { type: "opinion", promotional: false };
  if (fromOfficialSource || /press release|prnewswire|business wire|globe newswire|basin bulteni|pressemitteilung|communique de presse|comunicado de prensa/.test(f)) return { type: "press_release", promotional: true };
  return { type: "news", promotional: false };
}

// Ülke: önce sağlayıcının verdiği kaynak ülkesi, sonra metinde geçen ülke adı (sınırlı sözlük)
const COUNTRY_NAMES: Record<string, string> = {
  turkey: "TR", turkiye: "TR", "türkiye": "TR", germany: "DE", almanya: "DE", deutschland: "DE", norway: "NO", norvec: "NO",
  denmark: "DK", danimarka: "DK", netherlands: "NL", hollanda: "NL", "united states": "US", usa: "US", abd: "US",
  "united kingdom": "GB", uk: "GB", ingiltere: "GB", china: "CN", cin: "CN", japan: "JP", japonya: "JP", india: "IN", hindistan: "IN",
  "south korea": "KR", korea: "KR", "guney kore": "KR", france: "FR", fransa: "FR", italy: "IT", italya: "IT", spain: "ES", ispanya: "ES",
  poland: "PL", polonya: "PL", brazil: "BR", brezilya: "BR", portugal: "PT", portekiz: "PT", finland: "FI", finlandiya: "FI",
  sweden: "SE", isvec: "SE", switzerland: "CH", isvicre: "CH", "saudi arabia": "SA", "suudi arabistan": "SA", uae: "AE",
  "united arab emirates": "AE", egypt: "EG", misir: "EG", australia: "AU", avustralya: "AU", singapore: "SG", vietnam: "VN",
  indonesia: "ID", thailand: "TH", tayland: "TH", malaysia: "MY", mexico: "MX", meksika: "MX", greece: "GR", yunanistan: "GR",
  romania: "RO", romanya: "RO", bulgaria: "BG", bulgaristan: "BG", qatar: "QA", katar: "QA", "new zealand": "NZ",
};
// GDELT sourcecountry adları (İngilizce) için
export function countryFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  if (/^[A-Z]{2}$/.test(name)) return name;
  return COUNTRY_NAMES[fold(name).trim()] ?? null;
}

export function detectCountry(text: string, providerCountry?: string | null): { iso2: string | null; from: "text" | "provider" | null } {
  const f = ` ${fold(text).replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  for (const [n, iso] of Object.entries(COUNTRY_NAMES)) if (n.length > 2 && f.includes(` ${fold(n)} `)) return { iso2: iso, from: "text" };
  const p = countryFromName(providerCountry);
  return p ? { iso2: p, from: "provider" } : { iso2: null, from: null };
}

const REGION_OF: Record<string, string> = {
  TR: "Türkiye", DE: "Europe", NO: "Europe", DK: "Europe", NL: "Europe", GB: "Europe", FR: "Europe", IT: "Europe", ES: "Europe",
  PL: "Europe", PT: "Europe", FI: "Europe", SE: "Europe", CH: "Europe", GR: "Europe", RO: "Europe", BG: "Europe", SI: "Europe",
  US: "North America", MX: "Latin America", BR: "Latin America", CN: "Asia Pacific", JP: "Asia Pacific", IN: "Asia Pacific",
  KR: "Asia Pacific", SG: "Asia Pacific", VN: "Asia Pacific", ID: "Asia Pacific", TH: "Asia Pacific", MY: "Asia Pacific",
  AU: "Asia Pacific", NZ: "Asia Pacific", SA: "Middle East & Africa", AE: "Middle East & Africa", QA: "Middle East & Africa", EG: "Middle East & Africa",
};
export const regionOf = (iso2: string | null) => (iso2 ? REGION_OF[iso2] ?? null : null);
