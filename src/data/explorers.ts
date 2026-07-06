/**
 * Autor-Bilder der Erkunder-Notizen. Die offiziellen Note-Icons liegen lokal
 * in public/notes/ (via scripts/fetch-note-images.mjs). Fehlt eine Datei,
 * greift der SVG-Fallback in der jeweiligen Komponente.
 */
const slug = (explorer: string) =>
  explorer
    .toLowerCase()
    .replace(/[ ()-]/g, '')
    .replace(/é/g, 'e')
    .replace(/ç/g, 'c');

export const explorerImage = (explorer: string) => `/notes/${slug(explorer)}.webp`;

export const NOTE_PLACEHOLDER = '/notes/placeholder.svg';
