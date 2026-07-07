import { useEffect, useMemo, useRef, useState } from 'react';
import {
  breedingTimes,
  cloneCost,
  husbandryInfo,
  killXp,
  knockoutTable,
  spawnCommands,
  statAtLevel,
  statRank,
  tamingBonusLevels,
  tamingFoodTable,
  torporDrainRate,
  TAMED_GAIN_PCT,
  TOTAL_SPECIES,
  WILD_GAIN,
  type FoodRow,
  type KnockoutRow,
  type RankableStat,
} from '../data/gameplay';
import { MAX_LEVEL, MIN_LEVEL, useTamingCalculator } from '../hooks/useTamingCalculator';
import { formatDate, formatMinutes, formatNumber } from '../lib/format';
import type { Dino, MapName, TamedRecord } from '../types';
import {
  IconBerry,
  IconClose,
  IconCompass,
  IconCopy,
  IconEgg,
  IconFlask,
  IconNote,
  IconPinFilled,
  IconSkull,
  IconTerminal,
  IconTimer,
} from './icons';
import { SortableTh, useTableSort } from './SortableTable';

const DIFFICULTY_META: Record<Dino['difficulty'], { label: string; dot: string }> = {
  easy: { label: 'Leicht', dot: 'bg-green-400' },
  medium: { label: 'Mittel', dot: 'bg-yellow-400' },
  hard: { label: 'Schwer', dot: 'bg-red-400' },
};

type TabId = 'info' | 'taming' | 'knockout' | 'stats' | 'breeding' | 'misc';

const TABS: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Übersicht' },
  { id: 'taming', label: 'Zähmen' },
  { id: 'knockout', label: 'Betäuben' },
  { id: 'stats', label: 'Statuswerte' },
  { id: 'breeding', label: 'Zucht' },
  { id: 'misc', label: 'Umgang' },
];

const panelClass = 'rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5';

// Sortier-Zugriffe pro Tabelle (modul-konstant, damit useTableSort stabil bleibt)
const FOOD_ACCESSORS = {
  food: (r: FoodRow) => r.food,
  amount: (r: FoodRow) => r.amount,
  effectiveness: (r: FoodRow) => r.effectiveness,
  minutes: (r: FoodRow) => r.minutes,
};
const KO_ACCESSORS = {
  weapon: (r: KnockoutRow) => r.weapon,
  hits: (r: KnockoutRow) => r.hits,
  headHits: (r: KnockoutRow) => r.headHits,
  deathChance: (r: KnockoutRow) => r.deathChance,
};
interface StatRow {
  label: string;
  stat: RankableStat | null;
  base: number | null;
  wild: keyof typeof WILD_GAIN | null;
  tamedPct: number | null;
  suffix?: string;
}
const STAT_ACCESSORS = {
  base: (r: StatRow) => r.base ?? -1,
  wildGain: (r: StatRow) => (r.base !== null && r.wild ? r.base * WILD_GAIN[r.wild] : -1),
  tamedPct: (r: StatRow) => r.tamedPct ?? -1,
};

// Server-Rate (Taming Speed) – wie der „Zähmen: 1ד-Umschalter bei Dododex
const MULT_STORAGE_KEY = 'ark-dino-tracker:taming-mult';
const MULTIPLIERS = [1, 2, 3, 5, 10];

function loadMultiplier(): number {
  try {
    const stored = Number(localStorage.getItem(MULT_STORAGE_KEY));
    if (MULTIPLIERS.includes(stored)) return stored;
  } catch {
    // localStorage gesperrt – Standard verwenden.
  }
  return 1;
}
const headingClass = 'mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gray-300';
const chipClass = 'rounded border border-gray-700 bg-gray-900/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-gray-300';

function ChipList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-600">–</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={chipClass}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}

interface DinoDetailModalProps {
  dino: Dino;
  map: MapName;
  record: TamedRecord | undefined;
  note: string;
  onTogglePin: (level: number) => void;
  onUpdateLevel: (level: number) => void;
  onSaveNote: (text: string) => void;
  onClose: () => void;
}

/** Detail-Ansicht mit Dododex-artigen Tabs: Zähmen, Betäuben, Werte, Zucht, Umgang. */
export function DinoDetailModal({
  dino,
  map,
  record,
  note,
  onTogglePin,
  onUpdateLevel,
  onSaveNote,
  onClose,
}: DinoDetailModalProps) {
  const [level, setLevel] = useState(record?.level ?? 150);
  const [tab, setTab] = useState<TabId>('info');
  const [noteDraft, setNoteDraft] = useState(note);
  const [imageFailed, setImageFailed] = useState(false);
  const [incubationPct, setIncubationPct] = useState(0);
  const [maturationPct, setMaturationPct] = useState(0);
  const [multiplier, setMultiplier] = useState(loadMultiplier);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const taming = useTamingCalculator(dino, level);
  const tamed = record !== undefined;
  const difficulty = DIFFICULTY_META[dino.difficulty];
  // Nicht-zähmbare Kreaturen: „Getötet"-Tracking, keine Zähm-/Betäub-/Zucht-Tabs.
  const tameable = dino.tameable !== false;
  const doneLabel = tameable ? 'Gezähmt' : 'Getötet';
  const visibleTabs = tameable
    ? TABS
    : TABS.filter((t) => t.id === 'info' || t.id === 'stats' || t.id === 'misc');

  // ESC schließt das Modal; Fokus startet auf dem Close-Button.
  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Hintergrund-Scroll sperren, solange das Modal offen ist.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleLevelInput = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(parsed)));
    setLevel(clamped);
    // Bei bereits gezähmten Dinos wird das Level direkt mitgespeichert.
    if (tamed) onUpdateLevel(clamped);
  };

  // Notiz mit Debounce speichern (Auto-Save beim Tippen).
  const handleNoteChange = (text: string) => {
    setNoteDraft(text);
    clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => onSaveNote(text), 600);
  };
  useEffect(() => () => clearTimeout(noteTimerRef.current), []);

  const changeMultiplier = (value: number) => {
    setMultiplier(value);
    try {
      localStorage.setItem(MULT_STORAGE_KEY, String(value));
    } catch {
      // Nicht kritisch – gilt dann nur für die Sitzung.
    }
  };

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      // Clipboard nicht verfügbar (z. B. unsicherer Kontext) – still ignorieren.
    }
  };

  // Server-Rate: schnellere Zähmung = weniger Futter, weniger Narkose, kürzere Zeit.
  const foodRows = useMemo(
    () =>
      tamingFoodTable(dino, taming.kibbleCount, taming.tamingMinutes).map((row) => ({
        ...row,
        amount: Math.max(1, Math.ceil(row.amount / multiplier)),
        minutes: row.minutes / multiplier,
      })),
    [dino, taming.kibbleCount, taming.tamingMinutes, multiplier],
  );
  const narcotics = Math.ceil(taming.narcotics / multiplier);
  const knockout = useMemo(() => knockoutTable(dino, level), [dino, level]);
  const foodSort = useTableSort(foodRows, FOOD_ACCESSORS);
  const koSort = useTableSort(knockout, KO_ACCESSORS);
  const commands = useMemo(() => spawnCommands(dino, level), [dino, level]);
  const husbandry = useMemo(() => husbandryInfo(dino), [dino]);
  const breeding = useMemo(() => breedingTimes(dino), [dino]);
  const clone = useMemo(() => cloneCost(dino, level), [dino, level]);
  const drain = torporDrainRate(dino);

  const statRows: StatRow[] = [
    { label: 'Gesundheit', stat: 'health', base: dino.baseStats.health, wild: 'health', tamedPct: TAMED_GAIN_PCT.health },
    { label: 'Ausdauer', stat: 'stamina', base: dino.extraStats.stamina, wild: 'stamina', tamedPct: TAMED_GAIN_PCT.stamina },
    { label: 'Sauerstoff', stat: null, base: dino.extraStats.oxygen, wild: 'oxygen', tamedPct: TAMED_GAIN_PCT.oxygen },
    { label: 'Nahrung', stat: 'food', base: dino.extraStats.food, wild: 'food', tamedPct: TAMED_GAIN_PCT.food },
    { label: 'Gewicht', stat: 'weight', base: dino.extraStats.weight, wild: 'weight', tamedPct: TAMED_GAIN_PCT.weight },
    { label: 'Nahkampf', stat: 'melee', base: dino.baseStats.damage, wild: 'melee', tamedPct: TAMED_GAIN_PCT.melee, suffix: '%' },
    { label: 'Bewegung', stat: null, base: dino.baseStats.speed, wild: null, tamedPct: TAMED_GAIN_PCT.speed, suffix: '%' },
    { label: 'Betäubung', stat: 'torpor', base: dino.extraStats.torpor, wild: 'torpor', tamedPct: null },
  ];
  const statSort = useTableSort(statRows, STAT_ACCESSORS);
  const bestFood = foodRows[0]?.food;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details zu ${dino.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-2xl animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/70 ring-1 ring-white/[0.06] sm:animate-modal-in"
      >
        {/* Kopfbereich: Artwork + Titel */}
        <div className="relative h-40 shrink-0 overflow-hidden bg-gray-900 sm:h-48">
          <img
            src={imageFailed ? '/dinos/placeholder.svg' : dino.imageUrl}
            alt={dino.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ark-surface via-black/20 to-black/30" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-950/80 text-gray-300 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            <IconClose size={18} />
          </button>
          {tamed && (
            <span className="absolute left-3 top-3 rounded-full border border-green-500/50 bg-green-950/80 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm">
              {doneLabel} am {formatDate(record.tamedDate)}{tameable && ` · Lv. ${record.level}`}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4">
            <h2 className="font-display text-2xl font-bold text-white drop-shadow-md">{dino.name}</h2>
            <span className="mb-1 flex items-center gap-1.5 text-sm text-gray-200">
              <span aria-hidden className={`h-2 w-2 rounded-full ${difficulty.dot}`} />
              {difficulty.label}
            </span>
          </div>
        </div>

        {/* Wild-Level gilt für alle Tabs */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900/40 px-4 py-2.5 sm:px-6">
          <label htmlFor="level-input" className="shrink-0 text-xs uppercase tracking-widest text-gray-500">
            Wild-Level
          </label>
          <input
            type="range"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => handleLevelInput(e.target.value)}
            className="w-full accent-green-500"
            aria-label={`Wild-Level Schieberegler, aktuell ${level}`}
          />
          <input
            id="level-input"
            type="number"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => handleLevelInput(e.target.value)}
            className="w-16 shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-center font-mono text-sm text-green-300 outline-none focus:border-green-500"
          />
        </div>

        {/* Tab-Leiste */}
        <nav aria-label="Detail-Bereiche" className="scrollbar-hide shrink-0 overflow-x-auto border-b border-gray-800">
          <div className="flex w-max gap-1 px-2" role="tablist">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 px-3 py-2.5 text-sm transition-colors duration-200 ${
                  tab === t.id ? 'font-semibold text-green-300' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors duration-200 ${
                    tab === t.id ? 'bg-green-400' : 'bg-transparent'
                  }`}
                />
              </button>
            ))}
          </div>
        </nav>

        {/* Tab-Inhalt */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {tab === 'info' && (
            <>
              <p className="text-sm leading-relaxed text-gray-300">{dino.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {dino.roles.map((role) => (
                  <span key={role} className={chipClass}>{role}</span>
                ))}
              </div>
              <p className="flex items-start gap-1.5 text-sm text-gray-400">
                <IconCompass size={16} className="mt-0.5 shrink-0" />
                <span>Spawn auf {map}: {dino.spawnLocations.join(', ')}</span>
              </p>
              <section aria-label="Notizen" className={panelClass}>
                <h3 className={headingClass}>
                  <IconNote size={16} />
                  Notizen
                </h3>
                <textarea
                  value={noteDraft}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder={`Eigene Notizen zu ${dino.name} auf ${map} – z. B. Spawn-Koordinaten (Lat 35, Lon 78) …`}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-green-500"
                />
                <p className="mt-1.5 text-[11px] text-gray-600">Wird automatisch gespeichert.</p>
              </section>
            </>
          )}

          {tab === 'taming' && (
            <>
              <section aria-label="Futter" className={panelClass}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className={`${headingClass} mb-0`}>
                    <IconTimer size={16} />
                    Futter (Level {level})
                  </h3>
                  {/* Server-Rate wie bei Dododex: skaliert Menge, Zeit und Narkose */}
                  <div className="flex items-center gap-1" role="group" aria-label="Zähm-Multiplikator">
                    <span className="mr-1 text-[11px] uppercase tracking-widest text-gray-500">Zähmen</span>
                    {MULTIPLIERS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={multiplier === m}
                        onClick={() => changeMultiplier(m)}
                        className={`rounded-md border px-2 py-0.5 font-mono text-xs transition-colors ${
                          multiplier === m
                            ? 'border-green-500/60 bg-green-500/10 text-green-300'
                            : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                        }`}
                      >
                        {m}×
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[26rem] text-sm">
                    <thead>
                      <tr className="text-[11px]">
                        <SortableTh label="Futter" sortKey="food" sort={foodSort.sort} onToggle={foodSort.toggle} align="left" />
                        <SortableTh label="Menge" sortKey="amount" sort={foodSort.sort} onToggle={foodSort.toggle} />
                        <SortableTh label="Effektivität" sortKey="effectiveness" sort={foodSort.sort} onToggle={foodSort.toggle} />
                        <SortableTh label="Zeit" sortKey="minutes" sort={foodSort.sort} onToggle={foodSort.toggle} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/70">
                      {foodSort.sorted.map((row) => (
                        <tr key={row.food} className={row.food === bestFood ? 'text-green-300' : 'text-gray-300'}>
                          <td className="py-2 pr-2">{row.food}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{formatNumber(row.amount)}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{row.effectiveness.toFixed(1)} %</td>
                          <td className="py-2 text-right font-mono tabular-nums">{formatMinutes(row.minutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-center text-sm text-gray-300">
                  Mit Zähmbonus (bestes Futter):{' '}
                  <span className="font-mono font-bold text-amber-300">
                    Lv. {level + tamingBonusLevels(level, foodRows[0].effectiveness)}
                  </span>
                </p>
              </section>

              <section aria-label="Narkosemittel" className={panelClass}>
                <h3 className={headingClass}>
                  <IconFlask size={16} />
                  Narkosemittel
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3 text-center">
                    <p className="flex justify-center text-green-400/80"><IconFlask size={18} /></p>
                    <p className="mt-1 font-mono text-lg font-bold tabular-nums text-green-300">{formatNumber(narcotics)}</p>
                    <p className="text-[11px] text-gray-400">Narcotics</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3 text-center">
                    <p className="flex justify-center text-green-400/80"><IconBerry size={18} /></p>
                    <p className="mt-1 font-mono text-lg font-bold tabular-nums text-green-300">{formatNumber(narcotics * 5)}</p>
                    <p className="text-[11px] text-gray-400">Narcoberries</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">
                  Betäubungs-Abbau: <span className="text-gray-300">{drain.rate.toFixed(1)}/s ({drain.label})</span>
                </p>
              </section>
            </>
          )}

          {tab === 'knockout' && (
            <section aria-label="Betäuben" className={panelClass}>
              <h3 className={headingClass}>Treffer bis K.O. (Level {level})</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead>
                    <tr className="text-[11px]">
                      <SortableTh label="Waffe" sortKey="weapon" sort={koSort.sort} onToggle={koSort.toggle} align="left" />
                      <SortableTh label="Körper" sortKey="hits" sort={koSort.sort} onToggle={koSort.toggle} />
                      <SortableTh label="Kopf (×3)" sortKey="headHits" sort={koSort.sort} onToggle={koSort.toggle} />
                      <SortableTh label="Todeschance" sortKey="deathChance" sort={koSort.sort} onToggle={koSort.toggle} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/70">
                    {koSort.sorted.map((row) => (
                      <tr key={row.weapon} className="text-gray-300">
                        <td className="py-2 pr-2">{row.weapon}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{formatNumber(row.hits)}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{formatNumber(row.headHits)}</td>
                        <td className={`py-2 text-right font-mono tabular-nums ${row.deathChance >= 50 ? 'text-red-400' : row.deathChance > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                          {row.deathChance > 0 ? `${row.deathChance} %` : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-gray-600">
                Näherungswerte. Kopftreffer zählen ×3 (nicht bei allen Kreaturen möglich). Die
                Todeschance schätzt den Waffenschaden gegen die Gesundheit auf diesem Level.
              </p>
            </section>
          )}

          {tab === 'stats' && (
            <section aria-label="Statuswerte" className={panelClass}>
              <h3 className={headingClass}>Basiswerte &amp; Anstieg pro Level</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="text-[11px]">
                      <th className="pb-2 text-left font-medium uppercase tracking-widest text-gray-500">Wert</th>
                      <SortableTh label={`Basis (Lv. 1)`} sortKey="base" sort={statSort.sort} onToggle={statSort.toggle} />
                      <th className="pb-2 text-right font-medium uppercase tracking-widest text-gray-500">Lv. {level} wild</th>
                      <SortableTh label="Wild/Lv." sortKey="wildGain" sort={statSort.sort} onToggle={statSort.toggle} />
                      <SortableTh label="Gezähmt/Lv." sortKey="tamedPct" sort={statSort.sort} onToggle={statSort.toggle} />
                      <th className="pb-2 text-right font-medium uppercase tracking-widest text-gray-500">Rang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/70">
                    {statSort.sorted.map((row) => {
                      if (row.base === null) {
                        return (
                          <tr key={row.label} className="text-gray-600">
                            <td className="py-2 pr-2">{row.label}</td>
                            <td colSpan={5} className="py-2 text-right">– (Wasseratmer)</td>
                          </tr>
                        );
                      }
                      const gain = row.wild ? WILD_GAIN[row.wild] : 0;
                      return (
                        <tr key={row.label} className="text-gray-300">
                          <td className="py-2 pr-2">{row.label}</td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {formatNumber(row.base)}{row.suffix ?? ''}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-green-300">
                            {formatNumber(Math.round(statAtLevel(row.base, gain, level)))}{row.suffix ?? ''}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {row.wild ? `+${formatNumber(Math.round(row.base * gain * 10) / 10)}` : '–'}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {row.tamedPct !== null ? `+${row.tamedPct} %` : '–'}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-gray-500">
                            {row.stat && tameable ? `#${statRank(dino, row.stat)}/${TOTAL_SPECIES}` : '–'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'breeding' && (
            <>
              <section aria-label="Zucht-Zeiten" className={panelClass}>
                <h3 className={headingClass}>
                  <IconEgg size={16} />
                  Zucht-Zeiten
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                    <p className="text-xs text-gray-500">Paarungsintervall</p>
                    <p className="mt-1 font-mono text-gray-100">{formatMinutes(dino.breedingInterval)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                    <p className="text-xs text-gray-500">{breeding.isEgg ? 'Brutzeit' : 'Tragzeit'}</p>
                    <p className="mt-1 font-mono text-gray-100">{formatMinutes(breeding.incubationMinutes)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                    <p className="text-xs text-gray-500">Reifung</p>
                    <p className="mt-1 font-mono text-gray-100">{formatMinutes(breeding.maturationMinutes)}</p>
                  </div>
                </div>
              </section>

              <section aria-label="Baby-Timer" className={panelClass}>
                <h3 className={headingClass}>Baby-Timer</h3>
                <p className="mb-4 text-sm text-gray-400">
                  Gib den aktuellen Stand ein, um zu sehen, wie lange {breeding.isEgg ? 'Ei' : 'Tragzeit'} und
                  Aufzucht noch dauern.
                </p>
                {[
                  { label: `% ${breeding.isEgg ? 'Brutzeit' : 'Tragzeit'}`, value: incubationPct, setter: setIncubationPct, total: breeding.incubationMinutes },
                  { label: '% Heranwachsen', value: maturationPct, setter: setMaturationPct, total: breeding.maturationMinutes },
                ].map((row) => {
                  const remaining = row.total * (1 - row.value / 100);
                  const done = new Date(Date.now() + remaining * 60_000);
                  return (
                    <div key={row.label} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={row.value}
                          onChange={(e) => row.setter(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-20 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center font-mono text-sm text-green-300 outline-none focus:border-green-500"
                          aria-label={row.label}
                        />
                        <span className="text-sm text-gray-300">{row.label}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-gray-400">
                        <span className="font-mono font-semibold text-green-300">{formatMinutes(remaining)}</span>{' '}
                        verbleibend · fertig um{' '}
                        {new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(done)} Uhr
                      </p>
                    </div>
                  );
                })}
              </section>
            </>
          )}

          {tab === 'misc' && (
            <>
              <section aria-label="Umgang" className={`${panelClass} space-y-4`}>
                <ChipList title="Kann getragen werden von" items={husbandry.carriedBy} />
                <ChipList title="Betroffen von" items={husbandry.affectedBy} />
                <ChipList title="Kann beschädigen" items={husbandry.canDamage} />
                <ChipList title="Passt durch" items={husbandry.fitsThrough} />
              </section>
              <section aria-label="Beute und Kosten" className={`${panelClass} space-y-4`}>
                <ChipList title="Lässt fallen" items={dino.drops} />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                    <p className="text-xs text-gray-500">XP fürs Töten (Lv. {level})</p>
                    <p className="mt-1 font-mono text-gray-100">{formatNumber(killXp(dino, level))}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                    <p className="text-xs text-gray-500">Klonkammer (Lv. {level})</p>
                    <p className="mt-1 font-mono text-gray-100">
                      {formatNumber(clone.shards)} Splitter · {formatMinutes(clone.seconds / 60)}
                    </p>
                  </div>
                </div>
              </section>
              <section aria-label="Konsolen-Befehle" className={panelClass}>
                <h3 className={headingClass}>
                  <IconTerminal size={16} />
                  Konsolen-Befehle
                </h3>
                <div className="space-y-2">
                  {(tameable
                    ? [
                        { label: 'Wild spawnen', cmd: commands.wild },
                        { label: `Gezähmt (Lv. ${level})`, cmd: commands.tamed },
                      ]
                    : [{ label: 'Wild spawnen', cmd: commands.wild }]
                  ).map((entry) => (
                    <div key={entry.label}>
                      <p className="mb-1 text-[11px] uppercase tracking-widest text-gray-500">{entry.label}</p>
                      <div className="flex items-stretch gap-2">
                        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2 font-mono text-xs text-green-300">
                          {entry.cmd}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyCommand(entry.cmd)}
                          aria-label={`${entry.label} kopieren`}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-700 px-3 text-xs text-gray-300 transition-colors hover:border-green-600 hover:text-green-300"
                        >
                          <IconCopy size={14} />
                          {copiedCommand === entry.cmd ? 'Kopiert' : 'Kopieren'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Zähm-Status umschalten (übernimmt das aktuell eingestellte Level) */}
        <div className="shrink-0 border-t border-gray-800 p-3 sm:px-6">
          <button
            type="button"
            onClick={() => onTogglePin(level)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-display text-sm uppercase tracking-widest transition-all duration-200 active:scale-[0.98] ${
              tamed
                ? 'border-red-500/50 bg-red-900/40 text-red-300 hover:bg-red-900/70'
                : 'border-green-500/50 bg-green-900/60 text-green-300 hover:bg-green-800/80'
            }`}
          >
            {tameable ? <IconPinFilled size={16} /> : <IconSkull size={16} />}
            {tameable
              ? tamed
                ? 'Zähmung entfernen'
                : `Als gezähmt markieren (Lv. ${level})`
              : tamed
                ? 'Tötung entfernen'
                : 'Als getötet markieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
