import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Footnote, resolveFootnotes } from '@/utils/footnotes';

interface FootnoteTextProps {
  text: string;
  footnotes: Footnote[];
  className?: string;
  /** Footnote id -> display number, shared across the whole document so sidebar and inline numbers match. */
  indexById?: Record<string, number>;
  /** Footnote id to scroll-and-open when it changes (driven by an external footnote list/sidebar). */
  highlightId?: string | null;
  /** Called when re-anchoring finds a footnote's position has drifted, so the caller can persist the fix. */
  onReposition?: (id: string, start: number, end: number) => void;
}

interface Segment {
  content: string;
  /** All footnotes covering this exact slice of text - can be >1 when footnotes overlap. */
  footnoteIds: string[];
}

/** Splits text into segments using every footnote start/end as a cut point, so overlapping
 *  footnotes each keep their own coverage instead of the later one being dropped. */
function buildSegments(text: string, footnotes: Footnote[]): Segment[] {
  const valid = footnotes.filter((f) => f.start >= 0 && f.end <= text.length && f.start < f.end);
  if (valid.length === 0) return [{ content: text, footnoteIds: [] }];

  const points = new Set<number>([0, text.length]);
  valid.forEach((f) => {
    points.add(f.start);
    points.add(f.end);
  });
  const sorted = Array.from(points).sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const segStart = sorted[i];
    const segEnd = sorted[i + 1];
    if (segStart === segEnd) continue;
    const footnoteIds = valid.filter((f) => f.start <= segStart && f.end >= segEnd).map((f) => f.id);
    segments.push({ content: text.slice(segStart, segEnd), footnoteIds });
  }
  return segments;
}

export const FootnoteText = ({ text, footnotes, className, indexById, highlightId, onReposition }: FootnoteTextProps) => {
  // The set of footnote ids currently "selected" - every segment touching any of these ids
  // lights up together, so a footnote split by an overlapping neighbour still reads as one span.
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Editing the field shifts everything after the edit, so stored offsets can point at the wrong
  // substring by the time this renders. Re-anchor against the current text rather than trusting
  // them blindly; an orphaned footnote (its phrase no longer appears at all) is dropped from
  // rendering instead of highlighting an unrelated span.
  const resolved = resolveFootnotes(text, footnotes).filter((f) => !f.orphaned);
  const segments = buildSegments(text, resolved);
  const footnotesById = new Map(resolved.map((f) => [f.id, f]));

  useEffect(() => {
    if (!onReposition) return;
    resolved.forEach((fn) => {
      const original = footnotes.find((f) => f.id === fn.id);
      if (original && (original.start !== fn.start || original.end !== fn.end)) {
        onReposition(fn.id, fn.start, fn.end);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, footnotes]);

  // When a sidebar/list elsewhere asks to jump to a specific footnote, select every id sharing
  // that footnote's first segment (so an overlapping neighbour highlights alongside it, same as a direct click).
  useEffect(() => {
    if (!highlightId) {
      setActiveIds([]);
      return;
    }
    const segment = segments.find((s) => s.footnoteIds.includes(highlightId));
    setActiveIds(segment ? segment.footnoteIds : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  useEffect(() => {
    if (activeIds.length === 0) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveIds([]);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIds([]);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIds]);

  if (footnotes.length === 0) {
    return <div className={className}>{text}</div>;
  }

  const isSameSelection = (ids: string[]) =>
    ids.length === activeIds.length && ids.every((id) => activeIds.includes(id));

  const handleSegmentClick = (seg: Segment) => {
    setActiveIds(isSameSelection(seg.footnoteIds) ? [] : seg.footnoteIds);
  };

  // Only the first segment touched by the active selection renders the note popover,
  // even though every segment sharing one of those ids gets the highlighted background.
  const firstActiveIndex = segments.findIndex((s) => s.footnoteIds.some((id) => activeIds.includes(id)));

  return (
    <div ref={containerRef} className={className}>
      {segments.map((seg, i) => {
        if (seg.footnoteIds.length === 0) return <React.Fragment key={i}>{seg.content}</React.Fragment>;

        const isActive = seg.footnoteIds.some((id) => activeIds.includes(id));
        const showPopover = isActive && i === firstActiveIndex;
        const numbers = seg.footnoteIds.map((id) => indexById?.[id]).filter((n): n is number => !!n);

        return (
          <span key={`${seg.footnoteIds.join('|')}-${i}`} className="relative inline">
            <button
              type="button"
              data-footnote-ids={seg.footnoteIds.join(' ')}
              onClick={() => handleSegmentClick(seg)}
              className={cn(
                'underline decoration-dotted decoration-2 underline-offset-4 decoration-kangyur-orange text-inherit',
                'hover:bg-kangyur-orange/10 rounded-sm cursor-pointer',
                isActive && 'bg-kangyur-orange/20'
              )}
            >
              {seg.content}
            </button>
            {numbers.length > 0 && (
              <sup className="text-[0.65em] font-semibold text-kangyur-orange ml-0.5 select-none">
                [{numbers.join(',')}]
              </sup>
            )}
            {showPopover && (
              <span className="absolute z-50 left-0 top-full mt-1 w-64 max-w-[80vw] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-3 text-sm leading-normal whitespace-normal align-top space-y-2">
                {activeIds.map((id) => {
                  const fn = footnotesById.get(id);
                  if (!fn) return null;
                  return (
                    <div key={id}>
                      {!!indexById?.[id] && (
                        <span className="font-semibold text-kangyur-maroon mr-1">[{indexById[id]}]</span>
                      )}
                      {fn.note}
                    </div>
                  );
                })}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};
