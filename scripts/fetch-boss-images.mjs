/**
 * Lädt die Boss-Bilder aus dem Ark-Wiki (ark.fandom.com, CC-BY-SA)
 * nach public/bosses/<id>.webp. Einmalig: `node scripts/fetch-boss-images.mjs`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/bosses');
const THUMB_WIDTH = 400;

// Boss-ID (wie in bosses.ts) → Wiki-Dateititel.
const BOSSES = {
  broodmother: 'Broodmother Lysrix.png',
  megapithecus: 'Megapithecus.png',
  dragon: 'Dragon.png',
  overseer: 'Overseer.png',
  manticore: 'Manticore.png',
  desert_titan: 'Desert Titan.png',
  forest_titan: 'Forest Titan.png',
  ice_titan: 'Ice Titan.png',
  king_titan: 'King Titan.png',
  master_controller: 'Corrupted Master Controller.png',
  rockwell_prime: 'Rockwell Prime.png',
  crystal_wyvern_queen: 'Crystal Wyvern Queen.png',
  dinopithecus_king: 'Dinopithecus King.png',
  rockwell: 'Rockwell.png',
  moeder: 'Moeder.png',
  // Fjordur: Beyla (Riesenbiene) und Sköll & Hati (Riesenwölfe) haben im Wiki
  // keine eigenen Renders – die Kreaturen-Renders sind die passenden Motive.
  beyla: 'Giant Bee.png',
  skollhati: 'Direwolf.png',
  steinbjorn: 'Mod Fjordur Steinbjorn.png',
  fenrisulfr: 'Mod Fjordur Fenrir image.png',
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
const urlMap = await resolveUrls([...new Set(Object.values(BOSSES))]);

const missing = [];
let downloaded = 0;
for (const [id, title] of Object.entries(BOSSES)) {
  const url = urlMap.get(title);
  if (!url) {
    missing.push(`${id} (${title})`);
    continue;
  }
  const res = await fetch(thumbUrl(url), { headers: { 'user-agent': 'ark-dino-tracker' } });
  if (!res.ok) {
    missing.push(`${id} → HTTP ${res.status}`);
    continue;
  }
  await writeFile(path.join(OUT_DIR, `${id}.webp`), Buffer.from(await res.arrayBuffer()));
  downloaded += 1;
}

console.log(`✔ ${downloaded} Boss-Bilder nach public/bosses/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
