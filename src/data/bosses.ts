import type { MapName } from './../types';

export type BossDifficulty = 'gamma' | 'beta' | 'alpha';

export interface Boss {
  id: string;
  name: string;
  map: MapName;
  arena: string;
  /** Verfügbare Schwierigkeitsstufen (jede separat besiegbar). */
  difficulties: BossDifficulty[];
  /** Wie die Arena betreten wird. */
  access: string;
  /** Benötigte Tribute (Artefakte + Trophäen; Richtwerte, steigt je Stufe). */
  tribute: string[];
  /** Empfohlene Armee / Strategie. */
  recommended: string;
  /** Kurzbeschreibung. */
  description: string;
  imageUrl: string;
}

const img = (id: string) => `/bosses/${id}.webp`;
const GBA: BossDifficulty[] = ['gamma', 'beta', 'alpha'];

export const BOSSES: Boss[] = [
  {
    id: 'broodmother',
    name: 'Broodmother Lysrix',
    map: 'The Island',
    arena: 'Broodmother-Arena',
    difficulties: GBA,
    access: 'Beschwörung am grünen Obelisken oder in der Höhle',
    tribute: ['Artifact of the Clever', 'Artifact of the Hunter', 'Artifact of the Massive', 'Megalodon-Zähne', 'Spinnen-Flagellum'],
    recommended: '15–19 gezüchtete Rex (je Stufe stärker), Yutyrannus + Daeodon als Support',
    description: 'Riesige Spinnenkönigin, die Gift speit und Netze schießt. Der Einstiegs-Boss der Insel.',
    imageUrl: img('broodmother'),
  },
  {
    id: 'megapithecus',
    name: 'Megapithecus',
    map: 'The Island',
    arena: 'Megapithecus-Arena',
    difficulties: GBA,
    access: 'Beschwörung am blauen Obelisken',
    tribute: ['Artifact of the Brute', 'Artifact of the Devourer', 'Artifact of the Pack', 'Argentavis-Talon', 'Sarco-Haut'],
    recommended: '19 Rex mit Rüstungssattel; Vorsicht vor Rückstoß von der Klippe',
    description: 'Gigantischer Affe, der Felsen wirft und kleinere Gibbons ruft. Wirft Angreifer von der Plattform.',
    imageUrl: img('megapithecus'),
  },
  {
    id: 'dragon',
    name: 'Dragon',
    map: 'The Island',
    arena: 'Dragon-Arena',
    difficulties: GBA,
    access: 'Beschwörung am roten Obelisken',
    tribute: ['Artifact of the Immune', 'Artifact of the Skylord', 'Artifact of the Devious', 'Allosaurus-Hirn', 'Sauropod-Wirbel'],
    recommended: 'Deinonychus/Rex mit viel HP; der Feueratem macht prozentualen Schaden – hohe Lebenspunkte entscheidend',
    description: 'Fliegender Drache mit verheerendem Feueratem. Der härteste der drei Insel-Bosse.',
    imageUrl: img('dragon'),
  },
  {
    id: 'overseer',
    name: 'Overseer',
    map: 'The Island',
    arena: 'Tek-Höhle',
    difficulties: GBA,
    access: 'Tek-Höhle durchqueren, dann Beschwörung am Teleporter',
    tribute: ['Alle drei Boss-Trophäen (Broodmother, Megapithecus, Dragon)', 'Element', 'Eintritt nur nach den drei Arena-Bossen'],
    recommended: 'Starke Rex + Megatherium; der Overseer nimmt die Gestalt der drei Bosse an',
    description: 'Finaler Wächter der Insel. Wandelt zwischen den Formen der drei Bosse und bewacht das Aufstiegs-Portal.',
    imageUrl: img('overseer'),
  },
  {
    id: 'manticore',
    name: 'Manticore & Dragon',
    map: 'Ragnarok',
    arena: 'Ragnarok-Arena',
    difficulties: GBA,
    access: 'Beschwörung am Obelisken oder in der Boss-Arena',
    tribute: ['Artifact of the Hunter', 'Artifact of the Devourer', 'Artifact of the Immune', 'Artifact of the Skylord', 'diverse Trophäen'],
    recommended: 'Deinonychus-Schwarm oder Rex; Manticore und Dragon müssen zusammen bekämpft werden',
    description: 'Doppel-Boss: Ein fliegender Manticore und der Dragon gleichzeitig. Der Manticore landet nur zeitweise.',
    imageUrl: img('manticore'),
  },
  {
    id: 'desert_titan',
    name: 'Desert Titan',
    map: 'Extinction',
    arena: 'Wasteland (offene Welt)',
    difficulties: ['alpha'],
    access: 'Beschwörung an der Desert-Kaverne, Kampf am Himmel',
    tribute: ['Zugang über die Desert-Kaverne (Element-Adern)', 'kein klassisches Artefakt-Tribut'],
    recommended: 'Fliegende Mounts (Wyvern/Managarmr); der Titan lässt sich temporär zähmen',
    description: 'Fliegender Titan mit Blitz-Attacken und Schwarm-Geiern. Einer der vier Titanen von Extinction.',
    imageUrl: img('desert_titan'),
  },
  {
    id: 'forest_titan',
    name: 'Forest Titan',
    map: 'Extinction',
    arena: 'Sunken Forest',
    difficulties: ['alpha'],
    access: 'Beschwörung an der Forest-Kaverne',
    tribute: ['Zugang über die Forest-Kaverne', 'kein klassisches Artefakt-Tribut'],
    recommended: 'Corrupted-immune Strategie, Klettern an den Gliedmaßen; temporär zähmbar',
    description: 'Baumartiger Koloss mit Wurzel- und Corrupted-Attacken. Beschützt den Sunken Forest.',
    imageUrl: img('forest_titan'),
  },
  {
    id: 'ice_titan',
    name: 'Ice Titan',
    map: 'Extinction',
    arena: 'Snow Dome',
    difficulties: ['alpha'],
    access: 'Beschwörung an der Ice-Kaverne',
    tribute: ['Zugang über die Ice-Kaverne', 'kein klassisches Artefakt-Tribut'],
    recommended: 'Mek + starke DPS-Mounts; die Schwachstellen an Kopf/Brust/Rücken angreifen',
    description: 'Gepanzerter Frost-Titan, der schwierigste der drei Element-Titanen. Temporär zähmbar.',
    imageUrl: img('ice_titan'),
  },
  {
    id: 'king_titan',
    name: 'King Titan',
    map: 'Extinction',
    arena: 'Forbidden Zone',
    difficulties: GBA,
    access: 'Nach allen drei Titanen: Beschwörung in der Forbidden Zone',
    tribute: ['Trophäen von Desert-, Forest- und Ice-Titan', 'Element-Shards', 'gezähmte Titanen als Unterstützung'],
    recommended: 'Gezähmte Titanen + Mek-Squad; auf Alpha die härteste Herausforderung des Spiels',
    description: 'Corrupted-Endboss von Extinction. Nur nach dem Besiegen der drei Element-Titanen zugänglich.',
    imageUrl: img('king_titan'),
  },
  {
    id: 'master_controller',
    name: 'Corrupted Master Controller',
    map: 'Genesis 1',
    arena: 'Simulations-Finale',
    difficulties: GBA,
    access: 'Alle Missionen der Zonen abschließen, dann Endmission starten',
    tribute: ['Missionsabschlüsse statt Artefakten', 'Hexagon-Fortschritt', 'Genesis-Ausrüstung'],
    recommended: 'Magmasaur/Megatherium + Tek-Waffen; der Kampf hat mehrere Wellen und Phasen',
    description: 'KI-Endboss der Genesis-Simulation. Beschwört Corrupted-Kreaturen und Attack-Drohnen in Wellen.',
    imageUrl: img('master_controller'),
  },
  {
    id: 'rockwell_prime',
    name: 'Rockwell Prime',
    map: 'Genesis 2',
    arena: 'Rockwell-Arena',
    difficulties: GBA,
    access: 'Endmission der Genesis-2-Story',
    tribute: ['Missionsabschlüsse und Story-Fortschritt', 'Tek-Ausrüstung', 'starke Nahkampf-Mounts'],
    recommended: 'Shadowmane/Rex + Tek-Rüstung; Rockwell nutzt Tentakel und Corrupted-Adern in der Arena',
    description: 'Rockwell in seiner mächtigsten Form. Finaler Boss der gesamten Story-Saga (vor ASA).',
    imageUrl: img('rockwell_prime'),
  },
  {
    id: 'crystal_wyvern_queen',
    name: 'Crystal Wyvern Queen',
    map: 'Crystal Isles',
    arena: 'Crystal-Wyvern-Queen-Arena',
    difficulties: GBA,
    access: 'Beschwörung in der Arena im Norden der Map',
    tribute: ['Artifact of the Crag', 'Artifact of the Depths', 'diverse Trophäen', 'Crystal-Talismane'],
    recommended: 'Crystal Wyverns oder Rex; die Königin ruft Blut- und Ember-Wyvern-Adds',
    description: 'Majestätische Kristall-Wyvern-Königin, die kleinere Wyvern beschwört. Boss von Crystal Isles.',
    imageUrl: img('crystal_wyvern_queen'),
  },
  {
    id: 'dinopithecus_king',
    name: 'Dinopithecus King',
    map: 'Lost Island',
    arena: 'Dinopithecus-Arena',
    difficulties: GBA,
    access: 'Beschwörung in der Boss-Arena der Map',
    tribute: ['Artifact of the Brute', 'Artifact of the Destroyer', 'diverse Trophäen', 'Dinopithecus-Beute'],
    recommended: 'Rex/Therizinosaurus; der König wirft Fässer und ruft ein Pavian-Rudel',
    description: 'Riesiger Pavian-König, der Sprengfässer schleudert und sein Rudel befehligt. Boss von Lost Island.',
    imageUrl: img('dinopithecus_king'),
  },
  {
    id: 'manticore_se',
    name: 'Manticore',
    map: 'Scorched Earth',
    arena: 'Manticore-Arena',
    difficulties: GBA,
    access: 'Beschwörung an einem der drei Obelisken der Wüste',
    tribute: ['Artifact of the Crag', 'Artifact of the Destroyer', 'Artifact of the Gatekeeper', 'Wyvern-Trophäen', 'Deathworm-Hörner'],
    recommended: 'Wyvern-Geschwader oder gepanzerte Rexe; der Manticore landet nur phasenweise – Fernkampf bereithalten',
    description: 'Geflügelte Löwen-Skorpion-Chimäre und Herrscher der Wüste. Speit Gift aus der Luft und ruft Fleischfresser-Adds.',
    imageUrl: img('manticore'),
  },
  {
    id: 'rockwell',
    name: 'Rockwell',
    map: 'Aberration',
    arena: 'Rockwell-Terminal (Element-Region)',
    difficulties: GBA,
    access: 'Abstieg zum Terminal tief in der Element-Region',
    tribute: ['Artifact of the Depths', 'Artifact of the Shadows', 'Artifact of the Stalker', 'Reaper-Wimpel', 'Nameless-Gift'],
    recommended: 'Rock Drakes mit Hazard-Schutz + Tek-Waffen; erst die Tentakel zerstören, dann den Kern angreifen',
    description: 'Der mit Element verschmolzene Sir Edmund Rockwell. Kämpft mit Tentakeln, Element-Blitzen und Nameless-Wellen.',
    imageUrl: img('rockwell'),
  },
  {
    id: 'center_arena',
    name: 'Center-Arena (Broodmother & Megapithecus)',
    map: 'The Center',
    arena: 'Center-Arena (Doppel-Boss)',
    difficulties: GBA,
    access: 'Beschwörung an den Obelisken der Map',
    tribute: ['Artifact of the Brute', 'Artifact of the Clever', 'Artifact of the Devious', 'weitere Artefakte + Trophäen'],
    recommended: '19 gezüchtete Rexe mit Yutyrannus; beide Bosse spawnen gleichzeitig – zuerst die Broodmother fokussieren',
    description: 'Doppel-Boss-Arena von The Center: Broodmother Lysrix und Megapithecus greifen gemeinsam an – dafür gibt es doppelte Element-Beute.',
    imageUrl: img('broodmother'),
  },
  {
    id: 'valguero_arena',
    name: 'Valguero-Arena (Trio)',
    map: 'Valguero',
    arena: 'Forsaken Oasis (Dreifach-Boss)',
    difficulties: GBA,
    access: 'Beschwörung an den Obelisken oder Beacons',
    tribute: ['Artifact of the Crag', 'Artifact of the Cunning', 'Artifact of the Massive', 'diverse Trophäen'],
    recommended: 'Deinonychus-Schwarm oder Rex-Armee mit Daeodon; Manticore zuletzt, da er lange in der Luft bleibt',
    description: 'Die härteste Standard-Arena: Broodmother, Megapithecus und Manticore treten gemeinsam in der Forsaken Oasis an.',
    imageUrl: img('megapithecus'),
  },
  {
    id: 'beyla',
    name: 'Beyla',
    map: 'Fjordur',
    arena: 'Beylas Ruhestätte (Vannaland)',
    difficulties: GBA,
    access: 'Beschwörung mit Runensteinen am Beyla-Terminal unter dem Bienen-Hügel',
    tribute: ['30/60/90 Runensteine', 'Zugang über das Höhlen-Terminal'],
    recommended: 'Schattenmähnen oder Rexe; die Bienen-Adds schnell wegbrennen, bevor sie sich stapeln',
    description: 'Riesige Bienenkönigin aus der nordischen Mythologie. Ruft Bienenschwärme und vergiftet den Boden – erster der drei Mini-Bosse von Fjordur.',
    imageUrl: img('beyla'),
  },
  {
    id: 'skollhati',
    name: 'Sköll & Hati',
    map: 'Fjordur',
    arena: 'Wolfshöhle (Asgard-Portal)',
    difficulties: GBA,
    access: 'Beschwörung mit Runensteinen am Terminal in Vardiland',
    tribute: ['30/60/90 Runensteine', 'Zugang über das Höhlen-Terminal'],
    recommended: 'Rexe oder Schattenmähnen mit Heil-Daeodon; die Wolfszwillinge teilen sich Feuer- und Frost-Angriffe',
    description: 'Die mythischen Wolfszwillinge, die Sonne und Mond jagen. Doppel-Boss mit Feuer- und Eis-Attacken.',
    imageUrl: img('skollhati'),
  },
  {
    id: 'steinbjorn',
    name: 'Steinbjörn',
    map: 'Fjordur',
    arena: 'Steinbjörns Grotte (Jotunheim)',
    difficulties: GBA,
    access: 'Beschwörung mit Runensteinen am Terminal in der Eiswelt',
    tribute: ['30/60/90 Runensteine', 'Zugang über das Höhlen-Terminal'],
    recommended: 'Hohe Schadensspitzen (Giga/Schattenmähne); der Steinpanzer reflektiert Schaden – Heiler mitnehmen',
    description: 'Gigantischer Stein-Eisbär aus Jotunheim, dessen Panzer Angriffe reflektiert. Der zäheste der drei Fjordur-Mini-Bosse.',
    imageUrl: img('steinbjorn'),
  },
  {
    id: 'fenrisulfr',
    name: 'Fenrisúlfr',
    map: 'Fjordur',
    arena: 'Fenrisúlfr-Arena (Asgard)',
    difficulties: GBA,
    access: 'Erst Beyla, Sköll & Hati und Steinbjörn besiegen, dann Beschwörung mit deren Reliquien',
    tribute: ['Reliquien der drei Mini-Bosse', '30/60/90 Runensteine', 'Trophäen'],
    recommended: 'Voll ausgezüchtete Rexe/Schattenmähnen + Tek-Rüstung; friert Tames ein – Ausdauer im Blick behalten',
    description: 'Der Weltenwolf höchstpersönlich: Endboss von Fjordur mit Frost-Atem und Schattenphasen. Belohnt mit dem zähmbaren Fenrir.',
    imageUrl: img('fenrisulfr'),
  },
];

/** Alle Bosse einer Map. */
export function getBossesForMap(map: MapName): Boss[] {
  return BOSSES.filter((boss) => boss.map === map);
}

/** Zusammengesetzter Schlüssel für einen Boss-Sieg auf einer Stufe. */
export const bossKey = (bossId: string, difficulty: BossDifficulty) => `${bossId}:${difficulty}`;

/** Gesamtzahl aller Boss-Siege (Boss × Stufe) über alle Maps. */
export const TOTAL_BOSS_KILLS = BOSSES.reduce((sum, b) => sum + b.difficulties.length, 0);

export const DIFFICULTY_LABEL: Record<BossDifficulty, string> = {
  gamma: 'Gamma',
  beta: 'Beta',
  alpha: 'Alpha',
};
