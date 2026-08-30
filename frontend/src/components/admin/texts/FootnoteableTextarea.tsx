import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Button } from '@/components/ui/atoms/button';
import { Label } from '@/components/ui/atoms/label';
import { cn } from '@/lib/utils';
import {
  Footnote,
  addFootnote,
  deleteFootnote,
  getFootnotes,
  subscribeFootnotes,
  updateFootnote,
} from '@/utils/footnotes';
import { MessageSquarePlus, Pencil, Trash2 } from 'lucide-react';
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
  const [footnotes, setFootnotes] = useState<Footnote[]>([]);
  const [draft, setDraft] = useState<{ start: number; end: number; anchorText: string; note: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleAddFootnote = () => {
    const el = textareaRef.current;
    if (!el || !textId) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      toast.error(t('selectTextFirstForFootnote'));
      return;
    }
    setDraft({ start, end, anchorText: value.slice(start, end), note: '' });
  };

  const saveDraft = () => {
    if (!draft || !textId || !draft.note.trim()) return;
    addFootnote(textId, fieldKey, draft);
    setDraft(null);
  };

  const startEdit = (fn: Footnote) => {
    setEditingId(fn.id);
    setEditingNote(fn.note);
  };

  const saveEdit = () => {
    if (!editingId || !textId) return;
    updateFootnote(textId, fieldKey, editingId, editingNote);
    setEditingId(null);
  };

  const handleDelete = (fnId: string) => {
    if (!textId) return;
    deleteFootnote(textId, fieldKey, fnId);
  };

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

      <Textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn('resize-none', className)}
      />

      {draft && (
        <div className="rounded-md border border-kangyur-orange/30 bg-kangyur-orange/5 p-3 space-y-2">
          <p className={cn("text-xs text-muted-foreground", isTibetan && "tibetan")}>
            {t('footnoteFor')}: <span className="font-medium text-foreground">&ldquo;{draft.anchorText}&rdquo;</span>
          </p>
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

      {footnotes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className={cn("text-xs font-medium text-muted-foreground", isTibetan && "tibetan")}>
            {t('footnotesCount', { count: footnotes.length })}
          </p>
          {footnotes.map((fn, idx) => (
            <div key={fn.id} className="flex items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs">
              <span className="font-semibold text-kangyur-maroon shrink-0">[{idx + 1}]</span>
              <div className="flex-1 min-w-0">
                <p className={cn("truncate text-muted-foreground", isTibetan && "tibetan")}>&ldquo;{fn.anchorText}&rdquo;</p>
                {editingId === fn.id ? (
                  <div className="mt-1 space-y-1">
                    <Textarea
                      rows={2}
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      className="resize-none text-xs"
                    />
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setEditingId(null)}>
                        {t('cancel')}
                      </Button>
                      <Button type="button" size="sm" className="h-6 px-2 text-xs" onClick={saveEdit}>
                        {t('save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground">{fn.note}</p>
                )}
              </div>
              {editingId !== fn.id && (
                <div className="flex gap-1 shrink-0 pt-0.5">
                  <button type="button" onClick={() => startEdit(fn)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(fn.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
