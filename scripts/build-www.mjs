// Kökteki index.html'i (zamanlanmış görevin güncellediği dosya) www/ içine kopyalar
// ve uygulamaya özel köprü betiğini ekler. index.html'in kendisi değiştirilmez.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
if (!html.includes("</body>")) throw new Error("index.html içinde </body> bulunamadı");
mkdirSync("www", { recursive: true });
copyFileSync("app/native-bridge.js", "www/native-bridge.js");
writeFileSync("www/index.html", html.replace("</body>", '<script src="native-bridge.js"></script>\n</body>'));
console.log("www/ hazır");
