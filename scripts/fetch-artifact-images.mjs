/**
 * Lädt die Artefakt-Bilder aus dem Ark-Wiki (ark.fandom.com, CC-BY-SA)
 * nach public/artifacts/<slug>.webp. Einmalig: `node scripts/fetch-artifact-images.mjs`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/artifacts');
const THUMB_WIDTH = 200;

// Artefakt-Slug (wie in artifacts.ts) → Wiki-Dateititel.
const ARTIFACTS = {
  hunter: 'Artifact of the Hunter.png',
  pack: 'Artifact of the Pack.png',
  massive: 'Artifact of the Massive.png',
  clever: 'Artifact of the Clever.png',
  skylord: 'Artifact of the Skylord.png',
  devourer: 'Artifact of the Devourer.png',
  immune: 'Artifact of the Immune.png',
  strong: 'Artifact of the Strong.png',
  cunning: 'Artifact of the Cunning.png',
  brute: 'Artifact of the Brute.png',
  devious: 'Artifact of the Devious.png',
  flamekeeper: 'Artifact of the Flamekeeper.png',
  crag: 'Artifact of the Crag (Scorched Earth).png',
  depths: 'Artifact of the Depths (Aberration).png',
  shadows: 'Artifact of the Shadows (Aberration).png',
  stalker: 'Artifact of the Stalker (Aberration).png',
  destroyer: 'Artifact of the Destroyer (Scorched Earth).png',
  gatekeeper: 'Artifact of the Gatekeeper (Scorched Earth).png',
  lost: 'Artifact of the Lost.png',
  chaos: 'Artifact of Chaos (Extinction).png',
  growth: 'Artifact of Growth (Extinction).png',
  void: 'Artifact of the Void (Extinction).png',
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
const urlMap = await resolveUrls([...new Set(Object.values(ARTIFACTS))]);

const missing = [];
let downloaded = 0;
for (const [slug, title] of Object.entries(ARTIFACTS)) {
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
  await writeFile(path.join(OUT_DIR, `${slug}.webp`), Buffer.from(await res.arrayBuffer()));
  downloaded += 1;
}

console.log(`✔ ${downloaded} Artefakt-Bilder nach public/artifacts/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
