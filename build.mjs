// assets/work/<폴더>/ 안의 파일을 읽어 works.js 를 자동 생성 (직접 고칠 필요 없음)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const IMG = [".jpg", ".jpeg", ".png", ".gif", ".webp"], VID = [".mp4", ".webm", ".mov"];
const nfc = s => s.normalize("NFC");               // 맥 한글 파일명 대응
const stemOf = n => nfc(n.slice(0, n.length - extname(n).length));
const isMedia = n => IMG.includes(extname(n).toLowerCase()) || VID.includes(extname(n).toLowerCase());
const kind = n => (VID.includes(extname(n).toLowerCase()) ? "video" : "img");
/* 소리 트랙이 없는 mp4 는 silent 로 표시 (소리 버튼을 숨김) */
const silent = path => /\.(mp4|mov)$/i.test(path) && !/hdlr[\s\S]{8}soun/.test(readFileSync(root + path, "latin1"));
const url = path => path.split("/").map(encodeURIComponent).join("/");

// 이름(연도_회사_제목)과 txt 에서 제목·설명 만들기
function info(stem, txt) {
  const p = stem.split("_");
  let [year, company, title] = p.length >= 3 ? [p[0], p[1], p.slice(2).join("_")] : ["", "", stem];
  let desc = txt ? readFileSync(root + txt, "utf8").replace(/^\uFEFF/, "").trim() : "";
  // txt 첫 줄이 "2026 / 회사 / 제목" 이면 화면 제목으로 사용
  const [first, ...rest] = desc.split("\n");
  const head = first.match(/^\s*(\d{4})\s*\/([^/]+)\/(.+)/);
  if (head) { [year, company, title] = head.slice(1).map(s => nfc(s.trim())); desc = rest.join("\n").trim(); }
  return { year, company, title, desc };
}

const works = {};

for (const dir of readdirSync(root + "assets/work", { withFileTypes: true }).filter(d => d.isDirectory())) {
  const base = `assets/work/${dir.name}/`;
  const files = readdirSync(root + base).filter(n => !n.startsWith("."));
  const texts = new Map(files.filter(n => extname(n).toLowerCase() === ".txt").map(n => [stemOf(n), n]));
  const entries = readdirSync(root + base, { withFileTypes: true }).filter(e => !e.name.startsWith("."));
  works[dir.name] = entries
    .sort((a, b) => (nfc(a.name) < nfc(b.name) ? 1 : -1))    // 이름 역순: 최신 연도 먼저
    .flatMap(entry => {
      const name = entry.name;
      if (entry.isDirectory()) {
        // 폴더 하나 = 작업 하나. 안의 파일은 이름 순서대로 넘겨봄 (첫 번째가 썸네일)
        const inner = readdirSync(root + base + name).filter(n => !n.startsWith("."))
          .sort((a, b) => nfc(a).localeCompare(nfc(b), "en", { numeric: true }));
        const media = inner.filter(isMedia).map(n => ({ [kind(n)]: url(base + name + "/" + n), ...(silent(base + name + "/" + n) && { silent: true }) }));
        if (!media.length) return [];
        const txt = inner.find(n => extname(n).toLowerCase() === ".txt");
        const meta = info(nfc(name), txt && base + name + "/" + txt);
        // 첫 번째가 영상이면 영상이 썸네일
        if (media[0].video) return [{ ...meta, ...media[0], ...(media.length > 1 && { slides: media }) }];
        return [{ ...meta, img: media.find(m => m.img).img, slides: media }];
      }
      if (!isMedia(name)) return [];
      const stem = stemOf(name);
      return [{ ...info(stem, texts.has(stem) && base + texts.get(stem)), [kind(name)]: url(base + name), ...(silent(base + name) && { silent: true }) }];
    });
}
writeFileSync(root + "works.js", "const WORKS = " + JSON.stringify(works, null, 1) + ";\n");
console.log(Object.fromEntries(Object.entries(works).map(([k, v]) => [k, v.length])));
