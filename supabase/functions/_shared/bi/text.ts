// Metin yardımcıları. Deno (edge function) ve Node (testler) ile aynı şekilde çalışır.

const FOLD: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ç: "c", Ç: "c", ö: "o", Ö: "o", ü: "u", Ü: "u",
  ß: "ss", æ: "ae", ø: "o", å: "a", ł: "l", Ł: "l",
};

/** Küçük harf, aksan katlama (Türkçe dahil), tek boşluk. Çince karakterler korunur. */
export function fold(s: string): string {
  return s
    .replace(/[ıİşŞğĞçÇöÖüÜßæøåłŁ]/g, (c) => FOLD[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Eşleştirme için normal form: harf/rakam dışı her şey boşluk. */
export function norm(s: string): string {
  return fold(s).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

export const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CJK = /[぀-ヿ㐀-鿿]/;

/**
 * Bir ifadeyi kelime sınırlarıyla arayan RegExp üretir.
 * caseSensitive=false ise metin de fold() edilmiş olarak aranmalıdır.
 * Çince/Japonca ifadelerde kelime sınırı kullanılmaz.
 */
export function phraseRx(phrase: string, caseSensitive: boolean): RegExp {
  if (CJK.test(phrase)) return new RegExp(escapeRx(phrase), "g");
  const p = caseSensitive ? phrase : norm(phrase);
  const body = p.split(/\s+/).map(escapeRx).join("[\\s\\-–/&.]+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, caseSensitive ? "gu" : "giu");
}

/** Eşleşmenin etrafından kanıt alıntısı (en çok ~160 karakter). */
export function snippetAround(text: string, index: number, len: number, radius = 70): string {
  const a = Math.max(0, index - radius), b = Math.min(text.length, index + len + radius);
  return (a > 0 ? "…" : "") + text.slice(a, b).replace(/\s+/g, " ").trim() + (b < text.length ? "…" : "");
}

export function stripHtml(s: string): string {
  return decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
