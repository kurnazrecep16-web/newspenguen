// Kökteki index.html'i (zamanlanmış görevin güncellediği dosya) www/ içine kopyalar
// ve uygulamaya özel dosyaları (köprü, Boya Hesapla, stiller) ekler. index.html'in kendisi değiştirilmez.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
if (!html.includes("</body>")) throw new Error("index.html içinde </body> bulunamadı");
mkdirSync("www", { recursive: true });
for (const f of ["native-bridge.js", "app.js", "app.css"]) copyFileSync("app/" + f, "www/" + f);
writeFileSync(
  "www/index.html",
  html
    .replace("</head>", '<link rel="stylesheet" href="app.css">\n</head>')
    .replace("</body>", '<script src="app.js"></script>\n<script src="native-bridge.js"></script>\n</body>')
);
console.log("www/ hazır");
