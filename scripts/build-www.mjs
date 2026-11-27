// Uygulamayı www/ içine derler.
// Haber verisi, kökteki index.html'den (zamanlanmış görevin her 6 saatte güncellediği dosya)
// /*DATA_START*/ … /*DATA_END*/ bloğu çıkarılarak www/data.js'e yazılır. index.html'in kendisi değiştirilmez.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const m = html.match(/\/\*DATA_START\*\/([\s\S]*?)\/\*DATA_END\*\//);
if (!m) throw new Error("index.html içinde DATA_START/DATA_END bloğu bulunamadı");
if (!/const ITEMS\s*=/.test(m[1])) throw new Error("Veri bloğunda ITEMS yok");

mkdirSync("www/brand", { recursive: true });
writeFileSync("www/data.js", "/* index.html'den otomatik çıkarıldı */\n" + m[1].trim() + "\n");
for (const f of ["index.html", "app.css", "app.js", "scenes.js", "i18n.js", "native-bridge.js"]) copyFileSync("app/" + f, "www/" + f);
for (const f of readdirSync("app/brand")) copyFileSync("app/brand/" + f, "www/brand/" + f);
console.log("www/ hazır");
