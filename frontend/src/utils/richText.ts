/**
 * Helpers for the HTML-backed rich text content authored in the admin UI.
 *
 * Admin editors store their output as an HTML string in the same `String?`
 * columns that previously held plain text, so every read path has to cope with
 * both shapes: legacy rows are bare text with newlines, new rows are markup.
 * `toRichHtml` normalises either into HTML, and `sanitizeRichHtml` is applied
 * on the display side so nothing an admin (or a direct API call) stored can
 * execute in a reader's browser.
 */
import DOMPurify from 'dompurify';

/** Tags the editor's toolbar can produce, plus the ones legacy pasted markup tends to carry. */
const ALLOWED_TAGS = [
  'p', 'br', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'sub', 'sup', 'mark',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr',
  'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height',
  'class', 'style',
  'colspan', 'rowspan',
  // Quill marks list type and indent level on <li>/<ol> in Quill 2
  'data-list', 'data-indent', 'data-align',
];

/** Matches a real tag rather than a stray `<` or a `>` used as punctuation. */
const HTML_TAG_PATTERN = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/i;

/** True when the stored value already holds markup (as opposed to legacy plain text). */
export function isHtmlContent(value: string | null | undefined): boolean {
  if (!value) return false;
  return HTML_TAG_PATTERN.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Converts legacy plain text into the paragraph markup the editor and reader
 * expect, preserving the line breaks that `whitespace-pre-line` used to render.
 */
export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.trim()) return '';
  return normalized
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Normalises a stored value (HTML or legacy plain text) into HTML. Not sanitized. */
export function toRichHtml(value: string | null | undefined): string {
  if (!value) return '';
  return isHtmlContent(value) ? value : plainTextToHtml(value);
}

/** Strips anything executable, keeping the formatting the admin applied. */
export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // `javascript:`/`data:` URLs in href/src are rejected by this allowlist
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/** Stored value -> HTML that is safe to inject. The only conversion readers need. */
export function toSafeRichHtml(value: string | null | undefined): string {
  return sanitizeRichHtml(toRichHtml(value));
}

/**
 * True when the value renders as nothing. The editor emits `<p><br></p>` for an
 * empty document, and callers that gate on "has content" must not treat that as
 * filled in.
 */
export function isRichTextEmpty(value: string | null | undefined): boolean {
  if (!value) return true;
  // An image is the one tag that renders as content without contributing text.
  if (/<img\b/i.test(value)) return false;
  const text = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(?:160|xa0);/gi, ' ');
  return text.trim().length === 0;
}

/** Flattens rich text to a single line, for card excerpts, search and meta tags. */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value) return '';
  if (!isHtmlContent(value)) return value;
  const withBreaks = value
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  const stripped = sanitizeRichHtml(withBreaks).replace(/<[^>]*>/g, '');
  const decoded = typeof window === 'undefined'
    ? stripped
    : (() => {
        const el = window.document.createElement('textarea');
        el.innerHTML = stripped;
        return el.value;
      })();
  return decoded.replace(/\n{2,}/g, '\n').trim();
}
