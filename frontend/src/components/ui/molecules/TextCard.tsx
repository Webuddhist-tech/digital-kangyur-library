import React from 'react';
import { Link } from 'react-router-dom';
import { Book, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import useLanguage from '@/hooks/useLanguage';
import { pickBilingualDisplay, pickBilingualText } from '@/utils/localizedContent';
import { richTextToPlain } from '@/utils/richText';

interface Item {
  id: string;
  title: {
    tibetan: string;
    sanskrit?: string;
    english: string;
  };
  category: string;
  summary: {
    tibetan: string;
    english: string;
  };
  yana: string;
  volume: string;
  derge_id: string;
}

interface TextCardProps {
  id: string;
  item: Item;
  imageUrl?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  highlighted?: boolean;
}
const TextCard = ({
  id,
  item,
  imageUrl,
  className,
  variant = 'default',
  highlighted = false,
}: TextCardProps) => {
  const { isTibetan } = useLanguage();
  const derge_id = item.derge_id || undefined;
  const summary = richTextToPlain(pickBilingualText(isTibetan, item?.summary?.tibetan, item?.summary?.english));
  const volume = item.volume || undefined;
  const title =
    pickBilingualText(isTibetan, item.title?.tibetan, item.title?.english) ||
    (isTibetan ? 'བོད་ཡིག' : 'Text Title');
  const titleScript = pickBilingualDisplay(isTibetan, item.title?.tibetan, item.title?.english).scriptIsTibetan;
  const summaryScript = pickBilingualDisplay(isTibetan, item?.summary?.tibetan, item?.summary?.english).scriptIsTibetan;

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  const isRowLayout =
    !!imageUrl &&
    variant === 'default' &&
    !isCompact &&
    !isFeatured;

  // Added max-w-full to both flex container and content for row layout to prevent overflow
  return (
    <Link
      id={`karchag-text-${id}`}
      to={`/texts/${id}`}
      className={cn(
        'group block overflow-hidden transition-all duration-300',
        isCompact ? 'h-full' : '',
        isFeatured
          ? 'bg-gradient-to-br from-kangyur-cream to-white border border-kangyur-orange/20 rounded-xl shadow-sm hover:shadow-md'
          : 'bg-white border border-kangyur-orange/10 rounded-xl shadow-sm hover:shadow-md',
        highlighted &&
          'ring-2 ring-kangyur-orange ring-offset-2 ring-offset-white shadow-md z-[1] relative',
        className
      )}
    >
      <div
        className={cn(
          'flex w-full',
          isCompact
            ? 'flex-col h-full'
            : isRowLayout
            ? 'flex-row items-stretch gap-4 max-w-full'
            : 'flex-col'
        )}
        style={isRowLayout ? { maxWidth: '100%' } : undefined}
      >
        {/* Image - shown for compact and default variants */}
        {imageUrl && (isCompact || variant === 'default') && (
          <div
            className={cn(
              isRowLayout ? 'basis-1/5 hidden md:block flex-shrink-0 pt-2 px-2 min-w-0 max-w-xs' : ''
            )}
            style={isRowLayout ? { minWidth: 0, maxWidth: '240px' } : undefined}
          >
            <div
              className={cn('overflow-hidden', isRowLayout ? 'h-56' : 'h-56')}
            >
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 "></div>
              </div>
            </div>
            {/* Metadata under image for row layout */}
            {isRowLayout && (volume || derge_id) && (
              <div className="mt-2 pl-2 pb-3 flex items-center justify-between gap-4">
                {volume && (
                  <div className="flex items-center text-xs text-kangyur-dark/70">
                    <Book className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span>Volume: {volume}</span>
                  </div>
                )}
                {derge_id && (
                  <div className="flex items-center text-xs text-kangyur-dark/70">
                    <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span>{derge_id}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'flex flex-1 flex-col justify-center',
            isCompact
              ? 'p-4 flex-grow'
              : isFeatured
              ? 'p-6'
              : 'p-5',
            isRowLayout ? 'basis-4/5 min-w-0 max-w-full overflow-hidden' : ''
          )}
          style={
            isRowLayout
              ? {
                  minWidth: 0,
                  maxWidth: '100%',
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {/* Category badge - For featured and default without image */}
          {!isCompact && <div className="mb-3"></div>}

          {/* Title (website language only) */}
          <div className="mb-3">
            <h2
              className={cn(
                'font-semibold text-kangyur-dark group-hover:text-kangyur-green transition-colors truncate',
                isCompact ? 'text-base' : isFeatured ? 'text-3xl' : 'text-2xl',
                titleScript && 'tibetan'
              )}
              // Adding truncate for long titles in row layout, and containment for long unbroken texts
              style={isRowLayout ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' } : undefined}
            >
              {title}
            </h2>
          </div>

          {/* Metadata (hidden when using row layout, shown otherwise) */}
          {!isRowLayout && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
              {volume && (
                <div className="flex items-center text-xs text-kangyur-dark/70">
                  <Book className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span>Volume: {volume}</span>
                </div>
              )}
              {derge_id && (
                <div className="flex items-center text-xs text-kangyur-dark/70">
                  <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span>{derge_id} pages</span>
                </div>
              )}
            </div>
          )}

          {/* Summary (for non-compact) */}
          {summary && !isCompact && (
            <p
              className={cn(
                'w-full max-w-full break-words text-kangyur-dark/80 line-clamp-3 mb-4 text-xl' ,
                'text-lg',
                summaryScript && 'tibetan'
              )}
              style={isRowLayout ? { overflow: 'hidden', textOverflow: 'ellipsis' } : undefined}
            >
              {summary}
            </p>
          )}

          {/* Read more link for featured */}
          {isFeatured && (
            <div className="mt-4">
              <span className="inline-flex items-center text-kangyur-orange font-medium text-sm group-hover:underline">
                View text details
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
export default TextCard;