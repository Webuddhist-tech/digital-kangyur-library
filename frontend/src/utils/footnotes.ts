/**
 * Demo-only footnote storage backed by localStorage.
 *
 * Footnotes are keyed by (textId, fieldKey) where fieldKey matches the
 * underlying content field name (e.g. "translation_homage_english") so the
 * same anchor offsets line up between the admin editor and the public
 * reader, whichever language script is being displayed.
 */

export interface Footnote {
  id: string;
  start: number;
  end: number;
  anchorText: string;
  note: string;
  createdAt: string;
}

type FootnoteStore = Record<string, Record<string, Footnote[]>>;

const STORAGE_KEY = 'kangyur_footnotes_v1';
const CHANGE_EVENT = 'kangyur-footnotes-changed';

function readStore(): FootnoteStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: FootnoteStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently for this demo
  }
}

export function getFootnotes(textId: string, fieldKey: string): Footnote[] {
  const list = readStore()[textId]?.[fieldKey] || [];
  return [...list].sort((a, b) => a.start - b.start);
}

export function addFootnote(
  textId: string,
  fieldKey: string,
  footnote: { start: number; end: number; anchorText: string; note: string }
): Footnote {
  const store = readStore();
  const entry: Footnote = {
    id: `fn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...footnote,
  };
  const forText = store[textId] || {};
  forText[fieldKey] = [...(forText[fieldKey] || []), entry];
  store[textId] = forText;
  writeStore(store);
  return entry;
}

export function updateFootnote(textId: string, fieldKey: string, id: string, note: string): void {
  const store = readStore();
  const list = store[textId]?.[fieldKey];
  if (!list) return;
  store[textId][fieldKey] = list.map((f) => (f.id === id ? { ...f, note } : f));
  writeStore(store);
}

export function deleteFootnote(textId: string, fieldKey: string, id: string): void {
  const store = readStore();
  const list = store[textId]?.[fieldKey];
  if (!list) return;
  store[textId][fieldKey] = list.filter((f) => f.id !== id);
  writeStore(store);
}

/** Silently persists a footnote's re-anchored position (see resolveFootnotes) so future
 *  lookups start from an up-to-date hint instead of drifting further from the truth. */
export function repositionFootnote(textId: string, fieldKey: string, id: string, start: number, end: number): void {
  const store = readStore();
  const list = store[textId]?.[fieldKey];
  if (!list) return;
  const current = list.find((f) => f.id === id);
  if (!current || (current.start === start && current.end === end)) return;
  store[textId][fieldKey] = list.map((f) => (f.id === id ? { ...f, start, end } : f));
  writeStore(store);
}

export interface ResolvedFootnote extends Footnote {
  /** True when anchorText could not be found anywhere in the current text - start/end are meaningless. */
  orphaned: boolean;
}

/**
 * Re-anchors footnotes against the current text instead of trusting stored offsets blindly.
 * Editing the field shifts everything after the edit, so a footnote's recorded start/end can
 * point at the wrong substring (or past the end of the text) as soon as the surrounding content
 * changes. Before using an offset, this checks whether it still matches the footnote's original
 * anchor text; if not, it searches for that exact phrase again and re-anchors to whichever
 * occurrence sits closest to the old position (so an unrelated repeat of the same word elsewhere
 * doesn't get highlighted instead). If the phrase is gone entirely, the footnote is marked
 * orphaned so callers can skip rendering it rather than highlighting an unrelated span.
 */
export function resolveFootnotes(text: string, footnotes: Footnote[]): ResolvedFootnote[] {
  return footnotes.map((fn) => {
    const offsetsStillValid =
      fn.start >= 0 && fn.end > fn.start && fn.end <= text.length && text.slice(fn.start, fn.end) === fn.anchorText;
    if (offsetsStillValid) {
      return { ...fn, orphaned: false };
    }
    if (!fn.anchorText) {
      return { ...fn, start: 0, end: 0, orphaned: true };
    }

    const occurrences: number[] = [];
    for (let idx = text.indexOf(fn.anchorText); idx !== -1; idx = text.indexOf(fn.anchorText, idx + 1)) {
      occurrences.push(idx);
    }
    if (occurrences.length === 0) {
      return { ...fn, start: 0, end: 0, orphaned: true };
    }
    const nearest = occurrences.reduce(
      (best, cur) => (Math.abs(cur - fn.start) < Math.abs(best - fn.start) ? cur : best),
      occurrences[0]
    );
    return { ...fn, start: nearest, end: nearest + fn.anchorText.length, orphaned: false };
  });
}

/** Notifies on any footnote change, including from other tabs (storage event). */
export function subscribeFootnotes(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
