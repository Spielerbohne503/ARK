/** Formatiert Minuten human-readable, z. B. 165 → "2h 45min", 45 → "45min", 2900 → "2d 0h 20min". */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

/** Formatiert Zahlen mit Tausendertrennzeichen (de-DE). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}

/** Formatiert ein ISO-Datum kurz, z. B. "04.07.2026". */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
