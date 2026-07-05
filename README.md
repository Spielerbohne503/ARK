# 🦖 Ark Dino Tracker

Offline-fähiger Zähmungs-Tracker für **Ark: Survival Evolved** – behalte auf jeder Map den Überblick, welche Kreaturen du schon gezähmt hast.

![Tech](https://img.shields.io/badge/React%2018-TypeScript-blue) ![Style](https://img.shields.io/badge/Tailwind%20CSS-dark%20theme-green)

## Features

- **7 Maps**: The Island, Ragnarok, Extinction, Genesis 1, Genesis 2, Crystal Isles, Lost Island
- **80+ Kreaturen** mit Spawn-Locations, Base-Stats, Futter- und Kibble-Angaben
- **Pin-System** 📍: Dino als gezähmt markieren – Karte wird grün, Status wird in **IndexedDB** gespeichert (kein Server, komplett offline)
- **Completion-Tracker** mit Progress-Bar pro Map
- **Detail-Modal** mit **Taming-Calculator** (Level 1–150 → Kibble, Narcotics, Zähmzeit) und **Breeding-Infos**
- **Suche**, responsives Grid (1–4 Spalten), Dark Theme im Ark-Stil mit offiziellen Dossier-Artworks und sanften Animationen (Stagger-Einblendung, Hover-Effekte, Shimmer-Progress; respektiert `prefers-reduced-motion`)

## Schnellstart

```bash
npm install
npm run dev        # → http://localhost:5173
```

Produktions-Build:

```bash
npm run build      # Ausgabe in dist/
npm run preview    # Build lokal testen
```

## Technik

| Bereich | Lösung |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (Dark Theme, Cinzel + Roboto lokal gebundelt) |
| Persistenz | IndexedDB (eigener Promise-Wrapper, `src/lib/db.ts`) |
| Daten | Hardcoded in `src/data/dinoDatabase.ts` – keine API nötig |
| Bilder | Offizielle Dossier-Artworks, lokal gebundelt in `public/dinos/` (via `node scripts/fetch-images.mjs` aus dem Ark-Wiki, CC-BY-SA) – komplett offline |

## Projektstruktur

```
src/
├── data/dinoDatabase.ts      # Alle Dino-Daten
├── types.ts                  # TypeScript-Interfaces
├── lib/db.ts                 # IndexedDB-Wrapper
├── lib/format.ts             # Zeit-/Zahlenformatierung
├── hooks/useDinoTracker.ts   # Persistenz-Logik (Auto-Load/-Save)
├── hooks/useTamingCalculator.ts
└── components/               # App, MapSelector, CompletionBar,
                              # DinoGrid, DinoCard, DinoDetailModal
```

## Taming-Formel

```
wert = basis × (1 + (level − 1) × multiplier)
```

- Kibble: `multiplier = 0.033`, Zähmzeit: `multiplier = 0.025`
- Narcotics skalieren mit Zähmzeit und Schwierigkeitsgrad (easy ×0.5, medium ×1, hard ×2)
