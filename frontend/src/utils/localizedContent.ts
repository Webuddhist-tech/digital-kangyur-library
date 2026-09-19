/**
 * Bilingual UI helpers: prefer the string for the active site language (Tibetan / English),
 * and fall back to the other language when the preferred value is empty or whitespace.
 *
 * Content authored in the admin rich text editor is stored as HTML, so "empty"
 * has to mean "renders as nothing" rather than "is the empty string" - markup
 * like `<p><br></p>` is blank on screen but would otherwise beat a real value in
 * the other language.
 */
import { isRichTextEmpty } from './richText';

export function hasLocalizedContent(value: string | null | undefined): boolean {
  return typeof value === 'string' && !isRichTextEmpty(value);
}

export function pickBilingualText(
  isTibetan: boolean,
  tibetan: string | null | undefined,
  english: string | null | undefined
): string {
  const t = hasLocalizedContent(tibetan) ? (tibetan as string).trim() : '';
  const e = hasLocalizedContent(english) ? (english as string).trim() : '';
  if (isTibetan) {
    return t || e;
  }
  return e || t;
}

/** Same as pickBilingualText plus which script the chosen string is in (for typography classes). */
export function pickBilingualDisplay(
  isTibetan: boolean,
  tibetan: string | null | undefined,
  english: string | null | undefined
): { text: string; scriptIsTibetan: boolean } {
  const t = hasLocalizedContent(tibetan) ? (tibetan as string).trim() : '';
  const e = hasLocalizedContent(english) ? (english as string).trim() : '';
  if (isTibetan) {
    if (t) return { text: t, scriptIsTibetan: true };
    return { text: e, scriptIsTibetan: false };
  }
  if (e) return { text: e, scriptIsTibetan: false };
  return { text: t, scriptIsTibetan: true };
}
