import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import { cn } from '@/lib/utils';
import { isRichTextEmpty, toRichHtml } from '@/utils/richText';

/**
 * Quill tags alignment/colour/size/font with `ql-*` classes by default, which
 * only resolve inside a stylesheet-scoped `.ql-editor`. Switching those formats
 * to their style attributors writes inline CSS into the stored HTML instead, so
 * the public reader shows exactly what the admin saw without having to mirror
 * Quill's class rules. Indent has no style attributor and stays class-based -
 * `rich-text.css` carries those rules for both sides.
 */
let attributorsRegistered = false;
function registerStyleAttributors() {
  if (attributorsRegistered) return;
  attributorsRegistered = true;
  ['align', 'direction', 'color', 'background', 'font', 'size'].forEach((name) => {
    const attributor = (Quill as any).import(`attributors/style/${name}`);
    if (attributor) (Quill as any).register(attributor, true);
  });
}
registerStyleAttributors();

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'link'],
  ['clean'],
];

/** Kept in step with the sanitizer's allowlist in `@/utils/richText`. */
const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'indent', 'align',
  'blockquote', 'link', 'script', 'code', 'code-block',
];

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Approximate visible height in text rows, matching the Textarea prop it replaces. */
  rows?: number;
  /** Applies the Tibetan webfont to the editing surface. */
  tibetan?: boolean;
  readOnly?: boolean;
  className?: string;
}

/**
 * Admin-side rich text editor. Emits an HTML string, or `''` when the document
 * is empty, so existing "is this field filled in" checks keep working.
 */
export const RichTextEditor = ({
  id,
  value,
  onChange,
  placeholder,
  rows = 6,
  tibetan = false,
  readOnly = false,
  className,
}: RichTextEditorProps) => {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
      // Paste plain-ish markup rather than Quill's visual reconstruction, which
      // otherwise turns pasted line spacing into stacked empty paragraphs.
      clipboard: { matchVisual: false },
    }),
    []
  );

  /**
   * Legacy rows hold plain text and get converted for display; anything already
   * HTML - including everything Quill emits back through `onChange` - passes
   * through by identity, so the controlled prop never fights a keystroke.
   */
  const editorValue = toRichHtml(value);

  const handleChange = (html: string) => {
    onChange(isRichTextEmpty(html) ? '' : html);
  };

  return (
    <div
      id={id}
      className={cn(
        'rich-text-editor rounded-md border border-input bg-background',
        tibetan && 'rich-text-editor--tibetan',
        readOnly && 'opacity-60',
        className
      )}
      style={{ ['--rich-text-min-height' as string]: `${Math.max(rows, 3) * 1.75}rem` }}
    >
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        readOnly={readOnly}
        /**
         * Store the editor's own HTML rather than `getSemanticHTML()`. The
         * semantic form rewrites every space between words as `&nbsp;`
         * ("bullet&nbsp;one"), which stops long paragraphs - Tibetan ones in
         * particular - from wrapping. The raw form keeps real spaces and is
         * byte-identical to what the admin sees, which is what the reader then
         * reproduces via the shared `.ql-editor` rules.
         */
        useSemanticHTML={false}
      />
    </div>
  );
};

export default RichTextEditor;
