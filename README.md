# Ark Dino Tracker

Offline-fähiger Zähmungs-Tracker für **Ark: Survival Evolved** – behalte auf jeder Map den Überblick, welche Kreaturen du schon gezähmt hast.

![Tech](https://img.shields.io/badge/React%2018-TypeScript-blue) ![Style](https://img.shields.io/badge/Tailwind%20CSS-dark%20theme-green)

## Features

- **12 offizielle Maps**: alle Story-Maps (The Island, Scorched Earth, Aberration, Extinction, Genesis 1, Genesis 2) und alle kostenlosen offiziellen Maps (The Center, Ragnarok, Valguero, Crystal Isles, Lost Island, Fjordur)
- **208 Kreaturen** (145 zähmbare + 63 nicht-zähmbare mit „Getötet“-Tracking) – per Vier-Quellen-Abgleich (ark.fandom.com, ark.wiki.gg, arkids.net und den aus den ASE-Spieldateien extrahierten ARK-Smart-Breeding-Daten) auf Spezies-Ebene komplett für **ARK: Survival Evolved** (ASA-Inhalte bewusst ausgeschlossen); Varianten (Aberrant/X/R/Tek) sind über die Map-Zuordnung derselben Spezies abgedeckt
- **Pin-System**: Dino als gezähmt markieren – Karte wird grün, Status wird in **IndexedDB** gespeichert (kein Server, komplett offline)
- **Favoriten & Notizen**: Zähm-Wunschliste pro Map, Freitext-Notizen (z. B. Spawn-Koordinaten) mit Auto-Save
- **Filter & Sortierung**: Status, Schwierigkeit, Name/Schwierigkeit/zuletzt gezähmt
- **Backup**: Fortschritt als JSON exportieren/importieren
- **Beschreibungen + Einsatz-Rollen** für alle Kreaturen (z. B. „Metall-Farm", „Boss-Kampf")
- **Erkunder-Notizen-Tracker** (Explorer Notes): eigener Modus neben den Kreaturen – 167 Notizen über alle 12 Maps, gruppiert nach Autor (Helena Walker, Rockwell, Mei Yin, Nerva, Diana, Santiago, HLN-A, Gabriel, Grad-Student) mit dem **offiziellen In-Game-Notiz-Icon des Autors auf jeder Karte und im Detail-Fenster**, **lesbarem Inhaltstext**, Fundort-Koordinaten, gefunden-Markierung und Fortschritt pro Autor/Map (persistiert in IndexedDB)
- **Boss-Tracker**: eigener Modus mit allen Arena-Bossen pro Map (Broodmother, Megapithecus, Dragon, Overseer, Manticore, Rockwell, Titanen, King Titan, Master Controller, Rockwell Prime, Center- und Valguero-Arena, Crystal Wyvern Queen, Dinopithecus King sowie Beyla, Sköll & Hati, Steinbjörn und Fenrisúlfr auf Fjordur) samt Boss-Bild, Gamma/Beta/Alpha-Sieg-Tracking, Tribut-Anforderungen, Zugang und empfohlener Strategie
- **Artefakt-Tracker**: eigener Modus mit den Höhlen-Artefakten jeder Map (Bild, Höhle, Koordinaten, wofür sie als Boss-Tribut gebraucht werden), gefunden-Markierung und „nur offene"-Filter
- **Interaktive Karte 2.0**: Zoom (Mausrad/Pinch/Buttons) und Verschieben per Drag; schaltbare Ebenen für Erkunder-Notizen, Artefakte, **Höhlen-Eingänge**, **Ressourcen-Fundorte** (83 Farm-Spots, nach Art filterbar) und **Dino-Spawn-Regionen** per Kreaturen-Auswahl
- **„Wer war's?"**: optionaler Spielername pro Gerät – jeder Eintrag merkt sich, wer ihn abgehakt hat; das Dashboard zeigt das Duell („Du: 47 · Bro: 52")
- **Varianten-Tracking (opt-in)**: Tek-/X-/R-/Aberrant-Varianten als eigene Unterhaken im Detail-Fenster (zählen nicht in den Map-Fortschritt)
- **Meilenstein-Erfolge**: 17 Badges im Dashboard – von „Erster Fang" über „Alpha-Schlächter" und „König der Ozeane" bis „100 % ARK"
- **Dossier-Sammlung**: Unter-Tab im Erkunder-Notizen-Modus mit allen 162 Kreaturen-Dossiers (Helenas Dino-Seiten, Teil der In-Game-Explorer-Notes) als map-unabhängige Checkliste mit Artwork, Suche und „nur offene"-Filter – zählt in den Gesamtfortschritt
- **Kibble-Übersicht**: die 6 Kibble-Stufen mit Icon, Ei-Größe, Rezept, typischen Ei-Quellen und den Kreaturen, die sie zum Zähmen bevorzugen (live aus der Dino-Datenbank abgeleitet)
- **100%-Dashboard**: eigener Modus mit einer Fortschritts-Karte pro Map – alle fünf Kategorien (Gezähmt, Getötet, Notizen, Bosse, Artefakte) als Balken plus Gesamt-Prozent; Klick auf eine Map springt direkt in ihre Kreaturen-Liste
- **Gesamt-Fortschrittsbalken** im Hero: Zähmungen, Erkunder-Notizen, Boss-Siege und Artefakte über alle Maps zusammengefasst
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

## Live-Sync (geräteübergreifend)

Optional lässt sich der Fortschritt **in Echtzeit zwischen mehreren Geräten** teilen –
ohne Datei-Export/-Import. Sobald **eine** Supabase-Instanz in der Config hinterlegt
ist, synchronisiert sich **jedes Gerät automatisch**, das die Seite öffnet (gemeinsamer
Stand für dich und z. B. deinen Bruder). Ist nichts hinterlegt, läuft die App wie bisher
rein lokal/offline.

**Einrichtung (einmalig, ~5 Minuten):**

1. Auf [supabase.com](https://supabase.com) ein **kostenloses** Projekt anlegen.
2. Im **SQL Editor** einmal ausführen:

   ```sql
   create table if not exists sync_state (
     code text primary key,
     state jsonb not null default '{}'::jsonb,
     device text,
     updated_at timestamptz not null default now()
   );
   alter table sync_state enable row level security;
   create policy "anon access" on sync_state
     for all to anon using (true) with check (true);
   alter publication supabase_realtime add table sync_state;
   ```

3. Unter **Project Settings → API** die **Project URL** und den **anon public**-Key
   kopieren und in `src/lib/supabaseConfig.ts` eintragen:

   ```ts
   const HARDCODED_URL = 'https://DEIN-PROJEKT.supabase.co';
   const HARDCODED_ANON_KEY = 'eyJ…';   // anon public key
   ```

   Alternativ über Umgebungsvariablen beim Deploy: `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` (und optional `VITE_SUPABASE_ROOM`, um mehrere getrennte
   Gruppen zu betreiben – Standard ist ein gemeinsamer Raum `ark-shared`).

4. Neu bauen/deployen. Fertig – alle Geräte, die die Seite öffnen, sind live gesynct.

**Wie es funktioniert:** Der komplette Fortschritt (Zähmungen, Tötungen, Notizen,
Erkunder-Notizen, Bosse, Artefakte) liegt als eine JSON-Zeile in Supabase und wird per
**Supabase Realtime** (WebSocket) sofort auf alle Geräte gespiegelt. Lokal bleibt alles
weiter in IndexedDB, sodass die App auch offline funktioniert. Der `anon`-Key ist ein
öffentlicher Browser-Schlüssel (durch die Tabellen-Policy abgesichert) und darf im
Frontend stehen – gib die Seite aber nur an Leute weiter, mit denen du den Stand teilen
willst. Den Sync-Status siehst du im Footer unter **Live-Sync**.

## Technik

| Bereich | Lösung |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (Dark Theme, Cinzel + Roboto lokal gebundelt) |
| Persistenz | IndexedDB (eigener Promise-Wrapper, `src/lib/db.ts`) |
| Daten | Hardcoded in `src/data/dinoDatabase.ts` – keine API nötig |
| Bilder | Offizielle Dossier-Artworks (`public/dinos/`) und Notiz-Icons (`public/notes/`), lokal gebundelt via `node scripts/fetch-images.mjs` bzw. `fetch-note-images.mjs` aus dem Ark-Wiki (CC-BY-SA) – komplett offline |

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
