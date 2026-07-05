/**
 * Lädt die offiziellen Dossier-Artworks aller Dinos aus dem Ark-Wiki
 * (ark.fandom.com, CC-BY-SA) herunter und legt sie als WebP-Thumbnails
 * in public/dinos/<id>.webp ab. Einmalig ausführen: `node scripts/fetch-images.mjs`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://ark.fandom.com/api.php';
const OUT_DIR = path.resolve(import.meta.dirname, '../public/dinos');
const THUMB_WIDTH = 500;

/**
 * dinoId → Kandidaten für den Wiki-Dateititel (erster Treffer gewinnt).
 * Die Dossier-Dateien heißen i. d. R. "Dossier <In-Game-Name>.png".
 */
const CANDIDATES = {
  dodo: ['Dossier Dodo.png'],
  lystrosaurus: ['Dossier Lystrosaurus.png'],
  parasaur: ['Dossier Parasaur.png', 'Dossier Parasaurolophus.png'],
  phiomia: ['Dossier Phiomia.png'],
  moschops: ['Dossier Moschops.png'],
  trike: ['Dossier Trike.png', 'Dossier Triceratops.png'],
  stego: ['Dossier Stego.png', 'Dossier Stegosaurus.png'],
  carbonemys: ['Dossier Carbonemys.png'],
  dilophosaur: ['Dossier Dilophosaur.png', 'Dossier Dilo.png'],
  compy: ['Dossier Compy.png', 'Dossier Compsognathus.png'],
  mesopithecus: ['Dossier Mesopithecus.png'],
  oviraptor: ['Dossier Oviraptor.png'],
  pachy: ['Dossier Pachy.png', 'Dossier Pachycephalosaurus.png'],
  iguanodon: ['Dossier Iguanodon.png'],
  ichthyosaurus: ['Dossier Ichthyosaurus.png', 'Dossier Ichthy.png'],
  otter: ['Dossier Otter.png'],
  sinomacrops: ['Dossier Sinomacrops.png'],
  raptor: ['Dossier Raptor.png'],
  carno: ['Dossier Carno.png', 'Dossier Carnotaurus.png'],
  ankylosaurus: ['Dossier Ankylosaurus.png', 'Dossier Ankylo.png'],
  doedicurus: ['Dossier Doedicurus.png'],
  castoroides: ['Dossier Castoroides.png'],
  beelzebufo: ['Dossier Beelzebufo.png'],
  baryonyx: ['Dossier Baryonyx.png'],
  sarco: ['Dossier Sarco.png', 'Dossier Sarcosuchus.png'],
  kaprosuchus: ['Dossier Kaprosuchus.png'],
  terrorbird: ['Dossier Terror Bird.png'],
  direwolf: ['Dossier Direwolf.png', 'Dossier Dire Wolf.png'],
  sabertooth: ['Dossier Sabertooth.png'],
  hyaenodon: ['Dossier Hyaenodon.png'],
  mammoth: ['Dossier Mammoth.png'],
  woollyrhino: ['Dossier Woolly Rhino.png'],
  megaloceros: ['Dossier Megaloceros.png'],
  equus: ['Dossier Equus.png'],
  procoptodon: ['Dossier Procoptodon.png'],
  direbear: ['Dossier Dire Bear.png', 'Dossier Direbear.png'],
  purlovia: ['Dossier Purlovia.png'],
  pulmonoscorpius: ['Dossier Pulmonoscorpius.png', 'Dossier Scorpion.png'],
  araneo: ['Dossier Araneo.png', 'Dossier Araneomorphus.png'],
  arthropluera: ['Dossier Arthropluera.png'],
  pteranodon: ['Dossier Pteranodon.png'],
  dimorphodon: ['Dossier Dimorphodon.png'],
  argentavis: ['Dossier Argentavis.png'],
  pelagornis: ['Dossier Pelagornis.png'],
  ichthyornis: ['Dossier Ichthyornis.png'],
  gallimimus: ['Dossier Gallimimus.png'],
  bronto: ['Dossier Bronto.png', 'Dossier Brontosaurus.png'],
  diplodocus: ['Dossier Diplodocus.png'],
  paracer: ['Dossier Paracer.png', 'Dossier Paraceratherium.png'],
  kentrosaurus: ['Dossier Kentrosaurus.png'],
  megalodon: ['Dossier Megalodon.png'],
  dunkleosteus: ['Dossier Dunkleosteus.png'],
  anglerfish: ['Dossier Angler.png', 'Dossier Anglerfish.png'],
  manta: ['Dossier Manta.png'],
  gacha: ['Dossier Gacha.png'],
  gasbags: ['Dossier Gasbags.png'],
  maewing: ['Maewing image.png', 'Maewing Image.png', 'Maewing Image.jpg'],
  rex: ['Dossier Rex.png'],
  spino: ['Dossier Spino.png', 'Dossier Spinosaurus.png'],
  allosaurus: ['Dossier Allosaurus.png'],
  therizinosaurus: ['Dossier Therizinosaurus.png', 'Dossier Therizinosaur.png'],
  yutyrannus: ['Dossier Yutyrannus.png'],
  giganotosaurus: ['Dossier Giganotosaurus.png'],
  daeodon: ['Dossier Daeodon.png'],
  megatherium: ['Dossier Megatherium.png'],
  thylacoleo: ['Dossier Thylacoleo.png'],
  megalania: ['Dossier Megalania.png'],
  titanoboa: ['Dossier Titanoboa.png'],
  tapejara: ['Dossier Tapejara.png'],
  quetzal: ['Dossier Quetzal.png', 'Dossier Quetzalcoatlus.png'],
  snowowl: ['Dossier Snow Owl.png'],
  basilosaurus: ['Dossier Basilosaurus.png'],
  mosasaurus: ['Dossier Mosasaurus.png', 'Dossier Mosa.png'],
  plesiosaur: ['Dossier Plesiosaur.png', 'Dossier Plesiosaurus.png'],
  tusoteuthis: ['Dossier Tusoteuthis.png'],
  karkinos: ['Dossier Karkinos.png'],
  rockelemental: ['Dossier Rock Elemental.png', 'Dossier Rock Golem.png'],
  griffin: ['Dossier Griffin.png'],
  wyvern: ['Dossier Wyvern.png'],
  icewyvern: ['Dossier Ice Wyvern.png', 'Ice Wyvern.png', 'Dossier Wyvern.png'],
  crystalwyvern: ['Dossier Crystal Wyvern.png', 'Crystal Wyvern.png'],
  tropeognathus: ['Dossier Tropeognathus.png'],
  velonasaur: ['Dossier Velonasaur.png'],
  managarmr: ['Dossier Managarmr.png'],
  enforcer: ['Dossier Enforcer.png'],
  magmasaur: ['Magmasaur Image.jpg', 'Magmasaur Image.png', 'Magmasaur image.png'],
  ferox: ['Ferox Image.jpg', 'Ferox image.png', 'Ferox Image.png', 'Ferox (Large).png'],
  bloodstalker: ['Bloodstalker Image.jpg', 'Bloodstalker image.png', 'Bloodstalker Image.png'],
  megachelon: ['Megachelon PaintRegion0.jpg', 'Megachelon Image.jpg', 'Megachelon image.png'],
  astrocetus: ['Astrocetus Image.jpg', 'Astrocetus image.png', 'Astrocetus Image.png'],
  shadowmane: ['Genesis 2 Shadowmane.jpg', 'Shadowmane Image.jpg', 'Shadowmane image.png'],
  astrodelphis: ['Astrodelphis Image.jpg', 'Astrodelphis image.png', 'Astrodelphis Image.png'],
  noglin: ['Noglin Image.jpg', 'Noglin image.png', 'Noglin Image.png'],
  stryder: ['Tek Stryder Image.jpg', 'Tek Stryder image.png', 'Stryder Image.jpg', 'Tek Stryder.png'],
  amargasaurus: ['Dossier Amargasaurus.png'],
  dinopithecus: ['Dossier Dinopithecus.png'],
  deinonychus: ['Dossier Deinonychus.png'],
  basilisk: ['Dossier Basilisk.png'],
};

/** Fragt die MediaWiki-API in 50er-Batches nach den echten Bild-URLs. */
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
    const res = await fetch(`${API}?${params}`, {
      headers: { 'user-agent': 'ark-dino-tracker image fetcher' },
    });
    if (!res.ok) throw new Error(`API-Fehler: HTTP ${res.status}`);
    const data = await res.json();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const url = page.imageinfo?.[0]?.url;
      if (url) urls.set(page.title.replace(/^File:/, ''), url);
    }
    // Normalisierte Titel (Unterstriche etc.) zurückmappen
    for (const norm of data.query?.normalized ?? []) {
      const resolved = urls.get(norm.to.replace(/^File:/, ''));
      if (resolved) urls.set(norm.from.replace(/^File:/, ''), resolved);
    }
  }
  return urls;
}

/** Original-URL → kleines Thumbnail (Fandom-CDN unterstützt scale-to-width-down). */
function thumbUrl(originalUrl) {
  const [base, query] = originalUrl.split('?');
  return `${base}/scale-to-width-down/${THUMB_WIDTH}${query ? `?${query}` : ''}`;
}

await mkdir(OUT_DIR, { recursive: true });

const allTitles = [...new Set(Object.values(CANDIDATES).flat())];
console.log(`Frage ${allTitles.length} Dateititel bei ${API} an …`);
const urlMap = await resolveUrls(allTitles);

const missing = [];
let downloaded = 0;

for (const [dinoId, candidates] of Object.entries(CANDIDATES)) {
  const title = candidates.find((t) => urlMap.has(t));
  if (!title) {
    missing.push(`${dinoId} (${candidates.join(' | ')})`);
    continue;
  }
  const res = await fetch(thumbUrl(urlMap.get(title)), {
    headers: { 'user-agent': 'ark-dino-tracker image fetcher' },
  });
  if (!res.ok) {
    missing.push(`${dinoId} → HTTP ${res.status}`);
    continue;
  }
  await writeFile(path.join(OUT_DIR, `${dinoId}.webp`), Buffer.from(await res.arrayBuffer()));
  downloaded += 1;
}

console.log(`✔ ${downloaded} Bilder nach public/dinos/ geladen.`);
if (missing.length > 0) {
  console.log(`✘ ${missing.length} fehlen:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
