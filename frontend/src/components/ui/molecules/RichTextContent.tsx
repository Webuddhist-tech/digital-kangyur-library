import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toSafeRichHtml } from '@/utils/richText';

interface RichTextContentProps {
  /** Stored content: HTML from the admin editor, or legacy plain text. */
  value: string | null | undefined;
  /** Applies the Tibetan webfont, matching the editor's Tibetan mode. */
  tibetan?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

/**
 * Public-side renderer for admin-authored content. Shares `rich-text.css` with
 * the editor so a reader sees the same formatting that was applied in the admin
 * UI, and sanitizes on every render so stored markup can never execute.
 */
export const RichTextContent = ({
  value,
  tibetan = false,
  className,
  as: Tag = 'div',
}: RichTextContentProps) => {
  const html = useMemo(() => toSafeRichHtml(value), [value]);

  if (!html) return null;

  return (
    <Tag
      // `ql-editor` pulls in Quill's own list/indent/alignment rules so the
      // reader matches the admin view exactly; `rich-text-content` strips the
      // editor-only padding and scrolling back out.
      className={cn('ql-editor rich-text-content', tibetan && 'tibetan', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichTextContent;
