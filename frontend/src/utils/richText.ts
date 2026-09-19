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

/**
 * The only CSS properties the editor's toolbar produces, via the style
 * attributors registered in `RichTextEditor`. Allowing the `style` attribute
 * without narrowing it to these would let arbitrary declarations - `url(...)`,
 * `expression(...)`, `position: fixed` overlays - ride along in stored content,
 * and DOMPurify only filters CSS values when the host exposes a CSS parser.
 */
const ALLOWED_STYLE_PROPS = new Set([
  'text-align', 'direction', 'color', 'background-color', 'font-family', 'font-size',
]);

const UNSAFE_CSS_VALUE = /url\s*\(|expression\s*\(|javascript:|@import|behaviou?r\s*:|\\/i;

let styleHookRegistered = false;
function registerStyleFilter() {
  if (styleHookRegistered) return;
  styleHookRegistered = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node: any) => {
    if (typeof node?.getAttribute !== 'function' || !node.hasAttribute?.('style')) return;
    const kept = (node.getAttribute('style') || '')
      .split(';')
      .map((decl: string) => decl.trim())
      .filter((decl: string) => {
        const colon = decl.indexOf(':');
        if (colon < 0) return false;
        const prop = decl.slice(0, colon).trim().toLowerCase();
        const value = decl.slice(colon + 1).trim();
        return ALLOWED_STYLE_PROPS.has(prop) && !!value && !UNSAFE_CSS_VALUE.test(value);
      });
    if (kept.length) node.setAttribute('style', `${kept.join('; ')};`);
    else node.removeAttribute('style');
  });
}

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
 * expect, keeping the line breaks that `whitespace-pre-line` used to render.
 *
 * One paragraph per line rather than `<br>` inside one paragraph: Quill's
 * clipboard converter rewrites `<p>a<br>b</p>` to `<p>a</p><p>b</p>` when the
 * editor loads it, which would fire a change on mount, mark an untouched form
 * dirty, and leave the admin view a line-height apart from the reader. Emitting
 * what Quill would produce anyway makes the conversion a fixed point.
 */
export function plainTextToHtml(text: string): string {
  // Trailing blank lines are dropped: Quill discards the empty trailing
  // paragraph they would produce, which would otherwise be a drift on mount.
  const normalized = text.replace(/\r\n/g, '\n').trimEnd();
  if (!normalized) return '';
  return normalized
    .split('\n')
    .map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`)
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
  registerStyleFilter();
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
