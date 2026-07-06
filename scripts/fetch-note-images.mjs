/**
 * Lädt die offiziellen Explorer-Note-Icons der Autoren aus dem Ark-Wiki
 * (ark.fandom.com, CC-BY-SA) nach public/notes/<slug>.webp.
 * Einmalig ausführen: `node scripts/fetch-note-images.mjs`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/notes');
const THUMB_WIDTH = 256;

// Autor-Name (wie in explorerNotes.ts) → Wiki-Dateititel des Note-Icons.
const AUTHORS = {
  'Helena Walker': 'NoteHelena.png',
  'Sir Edmund Rockwell': 'NoteRockwell.png',
  'Mei Yin Li': 'NoteMeiYin.png',
  'The One Who Waits (Nerva)': 'NoteNerva.png',
  'Diana Altaras': 'NoteDiana.png',
  'Santiago da Costa': 'NoteSantiago.png',
  'HLN-A': 'NoteHLN-A.png',
  'Gabriel Santos': 'NoteGabriel.png',
  'Grad-Student': 'NoteGradStudent.png',
};

/** Muss identisch zur slug()-Funktion in scripts/gen bleiben. */
const slug = (s) =>
  s.toLowerCase().replaceAll(' ', '').replaceAll('(', '').replaceAll(')', '')
    .replaceAll('é', 'e').replaceAll('ç', 'c').replaceAll('-', '');

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
  return urls;
}

const thumbUrl = (u) => {
  const [base, query] = u.split('?');
  return `${base}/scale-to-width-down/${THUMB_WIDTH}${query ? `?${query}` : ''}`;
};

await mkdir(OUT_DIR, { recursive: true });
const urlMap = await resolveUrls([...new Set(Object.values(AUTHORS))]);

const missing = [];
let downloaded = 0;
for (const [author, title] of Object.entries(AUTHORS)) {
  const url = urlMap.get(title);
  if (!url) {
    missing.push(`${author} (${title})`);
    continue;
  }
  const res = await fetch(thumbUrl(url), { headers: { 'user-agent': 'ark-dino-tracker' } });
  if (!res.ok) {
    missing.push(`${author} → HTTP ${res.status}`);
    continue;
  }
  await writeFile(path.join(OUT_DIR, `${slug(author)}.webp`), Buffer.from(await res.arrayBuffer()));
  downloaded += 1;
}

console.log(`✔ ${downloaded} Note-Icons nach public/notes/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
