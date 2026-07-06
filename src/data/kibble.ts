import { DINO_DATABASE } from './dinoDatabase';

export interface Kibble {
  id: string;
  name: string;
  /** Ei-Größe, aus der die Kibble hergestellt wird. */
  eggSize: string;
  /** Qualitätsstufe 1–6. */
  quality: number;
  /** Rezept-Zutaten (ASA-orientiert, Richtwerte). */
  recipe: string[];
  /** Typische Kreaturen, deren Eier diese Kibble-Stufe ergeben. */
  eggSources: string[];
  imageUrl: string;
}

const img = (slug: string) => `/kibble/${slug}.webp`;

/**
 * Die sechs Kibble-Stufen. Die Kreaturen, die eine Kibble-Stufe zum Zähmen
 * bevorzugen, werden über `kibbleTames()` live aus der Dino-Datenbank abgeleitet
 * (Feld `kibbleType`). Rezepte sind Richtwerte im vereinheitlichten Kibble-System.
 */
export const KIBBLE: Kibble[] = [
  {
    id: 'basic',
    name: 'Basic Kibble',
    eggSize: 'Extra Small Egg',
    quality: 1,
    recipe: ['1× Extra Small Egg', '1× Cooked Meat', 'Amarberry, Tintoberry, Mejoberry', '5× Fiber', 'Wasser'],
    eggSources: ['Dodo', 'Lystrosaurus', 'Compy', 'Kairuku', 'Jerboa', 'Featherlight'],
    imageUrl: img('basic'),
  },
  {
    id: 'simple',
    name: 'Simple Kibble',
    eggSize: 'Small Egg',
    quality: 2,
    recipe: ['1× Small Egg', '1× Cooked Fish Meat', '1× Rockarrot', '5× Mejoberry', '5× Fiber', 'Wasser'],
    eggSources: ['Dilophosaurus', 'Pteranodon', 'Gallimimus', 'Pachy', 'Iguanodon', 'Ichthyornis'],
    imageUrl: img('simple'),
  },
  {
    id: 'regular',
    name: 'Regular Kibble',
    eggSize: 'Medium Egg',
    quality: 3,
    recipe: ['1× Medium Egg', '1× Cooked Fish Meat', '1× Longrass', '1× Savoroot', '5× Mejoberry', '5× Fiber', 'Wasser'],
    eggSources: ['Carno', 'Ankylosaurus', 'Terror Bird', 'Baryonyx', 'Diplodocus', 'Gasbags'],
    imageUrl: img('regular'),
  },
  {
    id: 'superior',
    name: 'Superior Kibble',
    eggSize: 'Large Egg',
    quality: 4,
    recipe: ['1× Large Egg', '1× Cooked Prime Meat', '1× Citronal', '1× Rare Mushroom', '5× Mejoberry', '10× Fiber', 'Wasser'],
    eggSources: ['Argentavis', 'Allosaurus', 'Snow Owl', 'Megalania', 'Thorny Dragon', 'Direbear'],
    imageUrl: img('superior'),
  },
  {
    id: 'exceptional',
    name: 'Exceptional Kibble',
    eggSize: 'Extra Large Egg',
    quality: 5,
    recipe: ['1× Extra Large Egg', '1× Focal Chili', '1× Rare Flower', '5× Mejoberry', '1× Sap', '10× Fiber', 'Wasser'],
    eggSources: ['Rex', 'Spino', 'Bronto', 'Giganotosaurus', 'Quetzal', 'Therizinosaurus'],
    imageUrl: img('exceptional'),
  },
  {
    id: 'extraordinary',
    name: 'Extraordinary Kibble',
    eggSize: 'Special Egg',
    quality: 6,
    recipe: ['1× Wyvern-/Rock-Drake-/Magmasaur-Ei', '1× Giant Bee Honey', '1× Sap', '1× Focal Chili', '5× Mejoberry', 'Wasser'],
    eggSources: ['Wyvern', 'Crystal Wyvern', 'Deinonychus', 'Magmasaur', 'Rock Drake'],
    imageUrl: img('extraordinary'),
  },
];

/** Kreaturen (Namen), die eine bestimmte Kibble-Stufe zum Zähmen bevorzugen. */
export function kibbleTames(kibbleName: string): string[] {
  return DINO_DATABASE.filter((d) => d.kibbleType === kibbleName)
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'de'));
}
