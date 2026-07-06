/**
 * Lädt die Kibble-Icons aus dem Ark-Wiki (ark.fandom.com, CC-BY-SA)
 * nach public/kibble/<slug>.webp. Einmalig: `node scripts/fetch-kibble-images.mjs`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/kibble');
const THUMB_WIDTH = 128;

const KIBBLE = {
  basic: 'Basic Kibble.png',
  simple: 'Simple Kibble.png',
  regular: 'Regular Kibble.png',
  superior: 'Superior Kibble.png',
  exceptional: 'Exceptional Kibble.png',
  extraordinary: 'Extraordinary Kibble.png',
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
const urlMap = await resolveUrls([...new Set(Object.values(KIBBLE))]);

const missing = [];
let downloaded = 0;
for (const [slug, title] of Object.entries(KIBBLE)) {
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

console.log(`✔ ${downloaded} Kibble-Icons nach public/kibble/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
