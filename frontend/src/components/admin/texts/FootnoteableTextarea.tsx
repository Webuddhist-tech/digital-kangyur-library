import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Button } from '@/components/ui/atoms/button';
import { Label } from '@/components/ui/atoms/label';
import { cn } from '@/lib/utils';
import {
  Footnote,
  addFootnote,
  buildFootnoteSegments,
  deleteFootnote,
  getFootnotes,
  repositionFootnote,
  resolveFootnotes,
  subscribeFootnotes,
  updateFootnote,
} from '@/utils/footnotes';
import { MessageSquarePlus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import useLanguage from '@/hooks/useLanguage';

interface FootnoteableTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
  /** Karchag text id. Footnote controls are disabled until the text is saved and has an id. */
  textId?: string;
  /** Content field name, e.g. "translation_homage_english" - must match the public reader's fieldKey. */
  fieldKey: string;
}

interface EditPopoverState {
  /** Footnote being edited - when a segment has overlapping footnotes, the first one wins. */
  id: string;
  top: number;
  left: number;
}

/** Textarea whose already-footnoted spans are highlighted directly in the text (matching the
 *  public reader's style) instead of listing footnotes in a panel below the field. A transparent
 *  overlay of the same text sits on top of the real textarea, pixel-aligned via matching font/
 *  padding and scroll position, so only its highlighted <mark> spans intercept clicks - everything
 *  else falls through to the textarea underneath for normal typing/selection. */
export const FootnoteableTextarea = ({
  id,
  label,
  value,
  onChange,
  rows = 6,
  className,
  textId,
  fieldKey,
}: FootnoteableTextareaProps) => {
  const { t, isTibetan } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayInnerRef = useRef<HTMLDivElement | null>(null);
  const [footnotes, setFootnotes] = useState<Footnote[]>([]);
  const [draft, setDraft] = useState<{ start: number; end: number; anchorText: string; note: string; top: number; left: number } | null>(null);
  const [editPopover, setEditPopover] = useState<EditPopoverState | null>(null);
  const [editingNote, setEditingNote] = useState('');

  useEffect(() => {
    if (!textId) {
      setFootnotes([]);
      return;
    }
    const load = () => setFootnotes(getFootnotes(textId, fieldKey));
    load();
    return subscribeFootnotes(load);
  }, [textId, fieldKey]);

  // Re-anchor against the live value so edits elsewhere in the field don't leave stale highlights.
  const resolved = resolveFootnotes(value, footnotes).filter((f) => !f.orphaned);
  const segments = buildFootnoteSegments(value, resolved);
  const footnotesById = new Map(resolved.map((f) => [f.id, f]));

  useEffect(() => {
    if (!textId) return;
    resolved.forEach((fn) => {
      const original = footnotes.find((f) => f.id === fn.id);
      if (original && (original.start !== fn.start || original.end !== fn.end)) {
        repositionFootnote(textId, fieldKey, fn.id, fn.start, fn.end);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, footnotes]);

  // Keep the highlight overlay's scroll position glued to the real textarea's.
  const syncScroll = () => {
    const el = textareaRef.current;
    if (!el || !overlayInnerRef.current) return;
    overlayInnerRef.current.style.transform = `translateY(-${el.scrollTop}px)`;
  };
  useEffect(syncScroll);

  useEffect(() => {
    if (!editPopover) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setEditPopover(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditPopover(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [editPopover]);

  /** Finds where a slice of the textarea's text actually renders on screen. A textarea has no
   *  native API for this (unlike a real DOM selection/Range), so this plants a marker span in a
   *  throwaway clone of the highlight overlay above - same classes, so same font/padding/wrapping
   *  as the real textarea by construction - and measures the marker instead of hand-copying styles. */
  const measureTextRect = (start: number, end: number): { top: number; left: number } | null => {
    const el = textareaRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return null;

    const mirror = document.createElement('div');
    mirror.className = cn(
      'pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 text-sm',
      className
    );
    mirror.style.visibility = 'hidden';

    mirror.appendChild(document.createTextNode(value.slice(0, start)));
    const marker = document.createElement('span');
    marker.textContent = value.slice(start, end);
    mirror.appendChild(marker);
    mirror.appendChild(document.createTextNode(value.slice(end)));

    wrapper.appendChild(mirror);
    const rects = marker.getClientRects();
    // Last fragment = where the selection ends, so the popover anchors below it rather than on top of it.
    const lastRect = rects[rects.length - 1] ?? marker.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    wrapper.removeChild(mirror);

    return {
      top: Math.max(lastRect.bottom - wrapperRect.top - el.scrollTop + 4, 0),
      left: Math.min(
        Math.max(lastRect.left - wrapperRect.left, 0),
        Math.max(wrapperRect.width - 260, 0)
      ),
    };
  };

  const handleAddFootnote = () => {
    const el = textareaRef.current;
    if (!el || !textId) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      toast.error(t('selectTextFirstForFootnote'));
      return;
    }
    setEditPopover(null);
    const anchor = measureTextRect(start, end) ?? { top: 4, left: 4 };
    setDraft({ start, end, anchorText: value.slice(start, end), note: '', top: anchor.top, left: anchor.left });
  };

  const saveDraft = () => {
    if (!draft || !textId || !draft.note.trim()) return;
    addFootnote(textId, fieldKey, draft);
    setDraft(null);
  };

  const openEditPopover = (e: React.MouseEvent<HTMLElement>, footnoteId: string) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const markRect = e.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    setDraft(null);
    setEditingNote(footnotesById.get(footnoteId)?.note || '');
    setEditPopover({
      id: footnoteId,
      top: markRect.bottom - wrapperRect.top + 4,
      left: Math.min(markRect.left - wrapperRect.left, Math.max(wrapperRect.width - 260, 0)),
    });
  };

  const saveEdit = () => {
    if (!editPopover || !textId) return;
    updateFootnote(textId, fieldKey, editPopover.id, editingNote);
    setEditPopover(null);
  };

  const handleDelete = () => {
    if (!editPopover || !textId) return;
    deleteFootnote(textId, fieldKey, editPopover.id);
    setEditPopover(null);
  };

  const editingFootnote = editPopover ? footnotesById.get(editPopover.id) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn("h-7 px-2 text-xs gap-1", isTibetan && "tibetan")}
          onClick={handleAddFootnote}
          disabled={!textId}
          title={textId ? t('selectTextToAddFootnote') : t('saveTextFirstForFootnotes')}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t('addFootnote')}
        </Button>
      </div>

      <div ref={wrapperRef} className="relative">
        {/* Highlight overlay: invisible text, visible only via the tinted/underlined <mark> spans that
            sit exactly on top of the real textarea's footnoted characters. */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 text-sm',
            className
          )}
        >
          <div ref={overlayInnerRef}>
            {segments.map((seg, i) =>
              seg.footnoteIds.length === 0 ? (
                <span key={i} className="text-transparent">
                  {seg.content}
                </span>
              ) : (
                <mark
                  key={i}
                  onClick={(e) => openEditPopover(e, seg.footnoteIds[0])}
                  className={cn(
                    'pointer-events-auto cursor-pointer rounded-sm bg-kangyur-orange/20 text-transparent underline decoration-dotted decoration-2 underline-offset-4 decoration-kangyur-orange hover:bg-kangyur-orange/30',
                    editPopover?.id && seg.footnoteIds.includes(editPopover.id) && 'bg-kangyur-orange/40'
                  )}
                >
                  {seg.content}
                </mark>
              )
            )}
          </div>
        </div>

        <Textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          rows={rows}
          className={cn('resize-none', className)}
        />

        {draft && (
          <div
            className="absolute z-20 w-64 max-w-[90%] space-y-2 rounded-md border border-kangyur-orange/30 bg-popover p-3 text-popover-foreground shadow-lg"
            style={{ top: draft.top, left: draft.left }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={cn("text-xs text-muted-foreground", isTibetan && "tibetan")}>
                {t('footnoteFor')}: <span className="font-medium text-foreground">&ldquo;{draft.anchorText}&rdquo;</span>
              </p>
              <button type="button" onClick={() => setDraft(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Textarea
              autoFocus
              rows={3}
              placeholder={t('footnoteContentPlaceholder')}
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              className="resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setDraft(null)}>
                {t('cancel')}
              </Button>
              <Button type="button" size="sm" onClick={saveDraft} disabled={!draft.note.trim()}>
                {t('saveFootnote')}
              </Button>
            </div>
          </div>
        )}

        {editPopover && editingFootnote && (
          <div
            className="absolute z-20 w-64 max-w-[90%] space-y-2 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg"
            style={{ top: editPopover.top, left: editPopover.left }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={cn("text-xs text-muted-foreground", isTibetan && "tibetan")}>
                &ldquo;{editingFootnote.anchorText}&rdquo;
              </p>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setEditPopover(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Textarea
              autoFocus
              rows={3}
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
              className="resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditPopover(null)}>
                {t('cancel')}
              </Button>
              <Button type="button" size="sm" onClick={saveEdit}>
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
