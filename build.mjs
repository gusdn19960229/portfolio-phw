// assets/work/<폴더>/ 안의 파일을 읽어 works.js 를 자동 생성 (직접 고칠 필요 없음)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const IMG = [".jpg", ".jpeg", ".png", ".gif", ".webp"], VID = [".mp4", ".webm", ".mov"];
const nfc = s => s.normalize("NFC");               // 맥 한글 파일명 대응
const stemOf = n => nfc(n.slice(0, n.length - extname(n).length));
const works = {};

for (const dir of readdirSync(root + "assets/work", { withFileTypes: true }).filter(d => d.isDirectory())) {
  const base = `assets/work/${dir.name}/`;
  const files = readdirSync(root + base).filter(n => !n.startsWith("."));
  const texts = new Map(files.filter(n => extname(n).toLowerCase() === ".txt").map(n => [stemOf(n), n]));
  works[dir.name] = files
    .sort((a, b) => (nfc(a) < nfc(b) ? 1 : -1))    // 파일명 역순: 최신 연도 먼저
    .flatMap(name => {
      const ext = extname(name).toLowerCase();
      if (!IMG.includes(ext) && !VID.includes(ext)) return [];
      const stem = stemOf(name), p = stem.split("_");
      let [year, company, title] = p.length >= 3 ? [p[0], p[1], p.slice(2).join("_")] : ["", "", stem];
      let desc = texts.has(stem) ? readFileSync(root + base + texts.get(stem), "utf8").replace(/^﻿/, "").trim() : "";
      // txt 첫 줄이 "2026 / 회사 / 제목" 이면 화면 제목으로 사용
      const [first, ...rest] = desc.split("\n");
      const head = first.match(/^\s*(\d{4})\s*\/([^/]+)\/(.+)/);
      if (head) { [year, company, title] = head.slice(1).map(s => nfc(s.trim())); desc = rest.join("\n").trim(); }
      const url = (base + name).split("/").map(encodeURIComponent).join("/");
      return [{ year, company, title, desc, [VID.includes(ext) ? "video" : "img"]: url }];
    });
}
writeFileSync(root + "works.js", "const WORKS = " + JSON.stringify(works, null, 1) + ";\n");
console.log(Object.fromEntries(Object.entries(works).map(([k, v]) => [k, v.length])));
