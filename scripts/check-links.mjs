/**
 * Internal link checker for the built site. Run after `npm run build`:
 *   node scripts/check-links.mjs
 * Reports internal hrefs/srcs that don't resolve to a file in _site/ and missing #anchors.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "_site");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const pages = walk(OUT);
const ids = new Map(); // url -> Set(ids)
const urlFor = (file) => "/" + file.slice(OUT.length + 1).replace(/\\/g, "/").replace(/index\.html$/, "");

for (const f of pages) {
  const html = readFileSync(f, "utf8");
  const set = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) set.add(m[1]);
  ids.set(urlFor(f), set);
}

let problems = 0;
for (const f of pages) {
  const html = readFileSync(f, "utf8");
  const from = urlFor(f);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let href = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(href)) {
      if (href.startsWith("#") && href.length > 1 && !ids.get(from)?.has(href.slice(1))) {
        console.log(`MISSING ANCHOR  ${from}  ->  ${href}`);
        problems++;
      }
      continue;
    }
    const [path, hash] = href.split("#");
    if (!path.startsWith("/")) {
      console.log(`RELATIVE LINK   ${from}  ->  ${href}`);
      problems++;
      continue;
    }
    const cleaned = path.split("?")[0];
    const candidates = [join(OUT, cleaned), join(OUT, cleaned, "index.html")];
    const ok = candidates.some((c) => existsSync(c));
    if (!ok) {
      console.log(`BROKEN          ${from}  ->  ${href}`);
      problems++;
    } else if (hash) {
      const target = cleaned.endsWith("/") ? cleaned : cleaned;
      const set = ids.get(target) || ids.get(target + "/");
      if (set && !set.has(hash)) {
        console.log(`MISSING ANCHOR  ${from}  ->  ${href}`);
        problems++;
      }
    }
  }
}
console.log(`\nChecked ${pages.length} pages. ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
