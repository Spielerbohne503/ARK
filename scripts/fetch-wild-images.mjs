/**
 * Lädt die Bilder der nicht-zähmbaren Kreaturen aus dem Ark-Wiki
 * (ark.fandom.com, CC-BY-SA) nach public/dinos/<id>.webp. Einmalig:
 *   node scripts/fetch-wild-images.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/dinos');
const THUMB_WIDTH = 200;

// Kreatur-Id (wie in wildCreatures.ts) → Wiki-Dateititel.
const WILD = {
  alpharaptor: 'Alpha Raptor.png',
  alphacarno: 'Alpha Carnotaurus.png',
  alpharex: 'Alpha T-Rex.png',
  alphamegalodon: 'Alpha Megalodon.png',
  alphamosasaur: 'Alpha Mosasaur.png',
  alphatuso: 'Alpha Tusoteuthis.png',
  leedsichthys: 'Leedsichthys.png',
  megapiranha: 'Megapiranha.png',
  eurypterid: 'Eurypterid.png',
  trilobite: 'Trilobite.png',
  corruptedrex: 'Corrupted Rex.png',
  corruptedspino: 'Corrupted Spino.png',
  corruptedgiga: 'Corrupted Giganotosaurus.png',
  corruptedwyvern: 'Corrupted Wyvern.png',
  corruptedarthro: 'Corrupted Arthropluera.png',
  corruptedreaper: 'Corrupted Reaper King.png',
  defenseunit: 'Defense Unit.png',
  insectswarm: 'Insect Swarm.png',
};

async function resolveUrls(titles) {
  const urls = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url',
      titles: batch.map((t) => `File:${t}`).join('|'),
    });
    const res = await fetch(`${API}?${params}`, { headers: { 'user-agent': 'ark-dino-tracker' } });
    if (!res.ok) throw new Error(`API-Fehler: HTTP ${res.status}`);
    const data = await res.json();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const url = page.imageinfo?.[0]?.url;
      if (url) urls.set(page.title.replace(/^File:/, ''), url);
    }
    for (const norm of data.query?.normalized ?? []) {
      const resolved = urls.get(norm.to.replace(/^File:/, ''));
      if (resolved) urls.set(norm.from.replace(/^File:/, ''), resolved);
    }
  }
  return urls;
}

const thumbUrl = (u) => {
  const [base, query] = u.split('?');
  return `${base}/scale-to-width-down/${THUMB_WIDTH}${query ? `?${query}` : ''}`;
};

await mkdir(OUT_DIR, { recursive: true });
const urlMap = await resolveUrls([...new Set(Object.values(WILD))]);

const missing = [];
let downloaded = 0;
for (const [id, title] of Object.entries(WILD)) {
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

console.log(`✔ ${downloaded} Wildtier-Bilder nach public/dinos/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
