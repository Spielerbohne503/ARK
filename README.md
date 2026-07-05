# Ark Dino Tracker

Offline-fähiger Zähmungs-Tracker für **Ark: Survival Evolved** – behalte auf jeder Map den Überblick, welche Kreaturen du schon gezähmt hast.

![Tech](https://img.shields.io/badge/React%2018-TypeScript-blue) ![Style](https://img.shields.io/badge/Tailwind%20CSS-dark%20theme-green)

## Features

- **7 Maps**: The Island, Ragnarok, Extinction, Genesis 1, Genesis 2, Crystal Isles, Lost Island
- **80+ Kreaturen** mit Spawn-Locations, Base-Stats, Futter- und Kibble-Angaben
- **Pin-System**: Dino als gezähmt markieren – Karte wird grün, Status wird in **IndexedDB** gespeichert (kein Server, komplett offline)
- **Favoriten & Notizen**: Zähm-Wunschliste pro Map, Freitext-Notizen (z. B. Spawn-Koordinaten) mit Auto-Save
- **Filter & Sortierung**: Status, Schwierigkeit, Name/Schwierigkeit/zuletzt gezähmt
- **Backup**: Fortschritt als JSON exportieren/importieren
- **Beschreibungen + Einsatz-Rollen** für alle 98 Kreaturen (z. B. „Metall-Farm", „Boss-Kampf")
- **Erkunder-Notizen-Tracker** (Explorer Notes): eigener Modus neben den Kreaturen – 119 Notizen über alle 7 Maps, gruppiert nach Autor (Helena Walker, Rockwell, Mei Yin, Nerva, Diana, Santiago, HLN-A …) mit Fundort-Koordinaten, gefunden-Markierung und Fortschritt pro Autor/Map (persistiert in IndexedDB)
- **Completion-Tracker** mit Progress-Bar pro Map
- **Detail-Ansicht mit 6 Tabs** (Dododex-Stil):
  - *Zähmen*: Futter-Tabelle (Kibble bis Beeren) mit Menge, Effektivität, Zeit und Zähmbonus-Level, Narkosemittel-Bedarf, Torpor-Abbaurate
  - *Betäuben*: Treffer bis K.O. für 9 Waffen (Körper/Kopf ×3) inkl. Todeschance
  - *Statuswerte*: alle 8 Werte mit Basis, Wild-Anstieg pro Level, Zähm-Anstieg und Rang unter allen Spezies
  - *Zucht*: Paarungsintervall, Brut-/Tragzeit, Reifung + Baby-Timer-Rechner
  - *Umgang*: Kann getragen werden von, betroffen von (Bola/Fallen), kann beschädigen, passt durch, Drops, Kill-XP, Klonkammer-Kosten
- **Sortierbare Tabellen**: Alle Detail-Tabellen (Futter, Waffen, Statuswerte) und der Planer lassen sich per Spaltenkopf auf-/absteigend sortieren
- **Server-Rate-Multiplikator** (1×–10×) im Zähmen-Tab: skaliert Futter, Narkose und Zeit, gespeichert für die nächste Sitzung
- **Konsolen-Befehle** pro Kreatur (wild + gezähmt) mit Copy-Button und echten Klassennamen
- **Zähm-Planer**: fasst deine Favoriten einer Map als Einkaufsliste zusammen (Kibble pro Sorte, Narcotics gesamt, Gesamtzähmzeit) bei frei wählbarem Ziel-Level
- **Design**: Cinematic Hero, Sticky-Toolbar mit Map-Tabs, 3D-Tilt + Cursor-Spotlight auf Karten, Film-Grain, Count-up-Statistiken, Toasts und Konfetti bei 100 % – eigenes SVG-Icon-Set, respektiert `prefers-reduced-motion`

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
