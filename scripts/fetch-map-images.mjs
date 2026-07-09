/**
 * Lädt die topografischen Karten-Bilder aus dem Ark-Wiki (ark.fandom.com,
 * CC-BY-SA) nach public/maps/<slug>.jpg. Einmalig:
 *   node scripts/fetch-map-images.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/maps');
const THUMB_WIDTH = 900;

// Map-Slug (wie in maps.ts) → Wiki-Dateititel.
const MAP_FILES = {
  theisland: 'The Island Topographic Map.jpg',
  scorchedearth: 'Scorched Earth Topographic Map.jpg',
  aberration: 'Aberration Topographic Map.jpg',
  ragnarok: 'Ragnarok Topographic Map.jpg',
  extinction: 'Extinction Topographic Map.jpg',
  genesis1: 'Genesis Part 1 Topographic Map.jpg',
  genesis2: 'Genesis Part 2 Map.jpg',
  thecenter: 'The Center Topographic Map.jpg',
  valguero: 'Valguero Topographic Map.jpg',
  crystalisles: 'Crystal Isles Topographic Map.jpg',
  lostisland: 'Lost Island Topographic Map.jpg',
  fjordur: 'Mod Fjordur Ingame Map.png',
};

async function resolveUrls(titles) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url',
    titles: titles.map((t) => `File:${t}`).join('|'),
  });
  const res = await fetch(`${API}?${params}`, { headers: { 'user-agent': 'ark-dino-tracker' } });
  if (!res.ok) throw new Error(`API-Fehler: HTTP ${res.status}`);
  const data = await res.json();
  const urls = new Map();
  for (const page of Object.values(data.query?.pages ?? {})) {
    const url = page.imageinfo?.[0]?.url;
    if (url) urls.set(page.title.replace(/^File:/, ''), url);
  }
  for (const norm of data.query?.normalized ?? []) {
    const resolved = urls.get(norm.to.replace(/^File:/, ''));
    if (resolved) urls.set(norm.from.replace(/^File:/, ''), resolved);
  }
  return urls;
}

const thumbUrl = (u) => {
  const [base, query] = u.split('?');
  return `${base}/scale-to-width-down/${THUMB_WIDTH}${query ? `?${query}` : ''}`;
};

await mkdir(OUT_DIR, { recursive: true });
const urlMap = await resolveUrls([...new Set(Object.values(MAP_FILES))]);

const missing = [];
let downloaded = 0;
for (const [slug, title] of Object.entries(MAP_FILES)) {
  const url = urlMap.get(title);
  if (!url) {
    missing.push(`${slug} (${title})`);
    continue;
  }
  const res = await fetch(thumbUrl(url), { headers: { 'user-agent': 'ark-dino-tracker' } });
  if (!res.ok) {
    missing.push(`${slug} → HTTP ${res.status}`);
    continue;
  }
  await writeFile(path.join(OUT_DIR, `${slug}.jpg`), Buffer.from(await res.arrayBuffer()));
  downloaded += 1;
}

console.log(`✔ ${downloaded} Karten-Bilder nach public/maps/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
