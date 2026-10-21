/**
 * Generates src/assets/img/world-map.svg (a lightweight, pre-styled world map)
 * and src/_data/mapBounds.json (bounding boxes per country, used to position pins).
 *
 * Source: @svg-maps/world (CC-BY-4.0, Victor Cazanave). Run: `node scripts/build-map.mjs`
 */
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const world = require("@svg-maps/world").default;

// Minimal SVG path walker: supports M m L l H h V v Z z C c S s Q q T t A a.
function bbox(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0,
    cmd = "",
    x = 0,
    y = 0,
    sx = 0,
    sy = 0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const track = () => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === "z" || cmd === "Z") {
        x = sx;
        y = sy;
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toLowerCase()) {
      case "m": {
        const nx = num(), ny = num();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        sx = x; sy = y;
        track();
        cmd = rel ? "l" : "L";
        break;
      }
      case "l": {
        const nx = num(), ny = num();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        track();
        break;
      }
      case "h": {
        const nx = num();
        x = rel ? x + nx : nx;
        track();
        break;
      }
      case "v": {
        const ny = num();
        y = rel ? y + ny : ny;
        track();
        break;
      }
      case "c": {
        for (let k = 0; k < 2; k++) { num(); num(); }
        const nx = num(), ny = num();
        x = rel ? x + nx : nx; y = rel ? y + ny : ny; track(); break;
      }
      case "s": case "q": {
        num(); num();
        const nx = num(), ny = num();
        x = rel ? x + nx : nx; y = rel ? y + ny : ny; track(); break;
      }
      case "t": {
        const nx = num(), ny = num();
        x = rel ? x + nx : nx; y = rel ? y + ny : ny; track(); break;
      }
      case "a": {
        for (let k = 0; k < 5; k++) num();
        const nx = num(), ny = num();
        x = rel ? x + nx : nx; y = rel ? y + ny : ny; track(); break;
      }
      default:
        i++;
    }
  }
  return { minX, minY, maxX, maxY };
}

const bounds = {};
for (const loc of world.locations) {
  const b = bbox(loc.path);
  bounds[loc.id] = { name: loc.name, x: +b.minX.toFixed(1), y: +b.minY.toFixed(1), w: +(b.maxX - b.minX).toFixed(1), h: +(b.maxY - b.minY).toFixed(1) };
}

// Round relative coordinates to one decimal to shrink the file (visually lossless at page sizes).
const paths = world.locations
  .map((l) => `<path d="${l.path.replace(/-?\d*\.\d+/g, (m) => (+m).toFixed(1))}"/>`)
  .join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${world.viewBox}" role="img" aria-label="World map"><g fill="#d6d2c4" stroke="#ffffff" stroke-width="0.4" stroke-linejoin="round">${paths}</g></svg>`;

mkdirSync(resolve(ROOT, "src/assets/img"), { recursive: true });
mkdirSync(resolve(ROOT, "src/_data"), { recursive: true });
writeFileSync(resolve(ROOT, "src/assets/img/world-map.svg"), svg);
writeFileSync(resolve(ROOT, "src/_data/mapBounds.json"), JSON.stringify({ viewBox: world.viewBox, bounds }, null, 0));
console.log(`world-map.svg: ${(svg.length / 1024).toFixed(0)} KB, ${world.locations.length} countries`);
for (const id of ["us", "cl", "mx", "nz", "za", "ch", "hu", "gb", "ie", "ee", "in", "pr", "cr", "gr"]) {
  console.log(id, bounds[id]);
}
