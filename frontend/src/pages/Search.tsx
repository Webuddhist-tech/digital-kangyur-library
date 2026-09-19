import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, Library, FileText } from 'lucide-react';
import KarchagSearch from '@/components/catalog/KarchagSearch';
import useLanguage from '@/hooks/useLanguage';
import api from '@/utils/api';
import { cn } from '@/lib/utils';
import { pickBilingualDisplay, pickBilingualText } from '@/utils/localizedContent';
import { richTextToPlain } from '@/utils/richText';

type CatalogSectionHit = {
  id: string;
  name_english?: string | null;
  name_tibetan?: string | null;
  description_english?: string | null;
  description_tibetan?: string | null;
  main_category?: {
    id: string;
    name_english?: string | null;
    name_tibetan?: string | null;
  } | null;
};

type TextHit = {
  id: string;
  title?: {
    tibetan?: string | null;
    english?: string | null;
    sanskrit?: string | null;
    chinese?: string | null;
  };
  derge_id?: string | null;
  sub_category?: {
    id: string;
    main_category_id?: string;
    name_english?: string | null;
    name_tibetan?: string | null;
  } | null;
};

type MergedRow =
  | { kind: 'text'; data: TextHit }
  | { kind: 'catalog_section'; data: CatalogSectionHit };

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t, isTibetan } = useLanguage();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) {
        return {
          results: {
            texts: { items: [], total: 0 },
            subCategories: { items: [], total: 0 },
          },
          query: '',
        };
      }
      const response = await api.search({ q: query, type: 'all' });
      return response;
    },
    enabled: !!query,
  });

  const subCategories: CatalogSectionHit[] = searchResults?.results?.subCategories?.items || [];
  const texts: TextHit[] = searchResults?.results?.texts?.items || [];

  const mergedRows: MergedRow[] = useMemo(() => {
    const textRows: MergedRow[] = texts.map((data) => ({ kind: 'text', data }));
    const sectionRows: MergedRow[] = subCategories.map((data) => ({ kind: 'catalog_section', data }));
    return [...textRows, ...sectionRows];
  }, [texts, subCategories]);

  const totalResults = mergedRows.length;

  const catalogHrefForSection = (section: CatalogSectionHit) => {
    const mainId = section.main_category?.id || '';
    return `/catalog?category=${encodeURIComponent(mainId)}&item=${encodeURIComponent(section.id)}`;
  };

  const hrefForText = (text: TextHit) => {
    const sub = text.sub_category;
    if (sub?.id && sub.main_category_id) {
      const base = `/catalog?category=${encodeURIComponent(sub.main_category_id)}&item=${encodeURIComponent(sub.id)}`;
      return `${base}&highlightText=${encodeURIComponent(text.id)}`;
    }
    return `/texts/${encodeURIComponent(text.id)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white w-full font-tibetan">
      <KarchagSearch />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {(() => {
          if (isLoading) {
            return (
              <div className="text-center py-16">
                <p className="text-kangyur-dark/60">{t('loading') || 'Loading...'}</p>
              </div>
            );
          }

          if (!query) {
            return (
              <div className="text-center py-16 rounded-2xl border border-stone-200/80 bg-white/80 shadow-sm">
                <p className="text-kangyur-dark/70 text-lg">
                  {t('enterSearchQuery') || 'Enter a search term to explore the catalog.'}
                </p>
              </div>
            );
          }

          if (totalResults === 0) {
            return (
              <div className="text-center py-16 rounded-2xl border border-stone-200/80 bg-white shadow-sm">
                <p className="text-kangyur-dark text-lg">
                  {t('noResultsFound') || 'No results found for'} &ldquo;{query}&rdquo;
                </p>
                <p className="text-kangyur-dark/60 mt-3 text-sm">
                  {t('tryDifferentSearch') || 'Try different keywords or spelling.'}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-stone-200 pb-4">
                <h1 className={cn('text-2xl font-semibold text-kangyur-dark', isTibetan && 'tibetan')}>
                  {t('searchResults') || 'Search results'}
                </h1>
                <p className="text-sm text-kangyur-dark/60">
                  {totalResults}{' '}
                  {totalResults === 1
                    ? t('searchResultCountOne') || 'match'
                    : t('searchResultCountMany') || 'matches'}
                  {` · “${query}”`}
                </p>
              </div>

              <ul className="space-y-3">
                {mergedRows.map((row) => {
                  if (row.kind === 'catalog_section') {
                    const section = row.data;
                    const title = pickBilingualDisplay(
                      isTibetan,
                      section.name_tibetan,
                      section.name_english
                    );
                    const desc = richTextToPlain(
                      pickBilingualText(
                        isTibetan,
                        section.description_tibetan,
                        section.description_english
                      )
                    );
                    const collectionName = section.main_category
                      ? pickBilingualText(
                          isTibetan,
                          section.main_category.name_tibetan,
                          section.main_category.name_english
                        )
                      : '';

                    return (
                      <li key={`section-${section.id}`}>
                        <Link
                          to={catalogHrefForSection(section)}
                          className="group flex gap-4 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all hover:border-kangyur-orange/35 hover:shadow-md"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-kangyur-orange/10 text-kangyur-orange">
                            <Library className="h-5 w-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                                {t('catalogSection') || 'Catalog section'}
                              </span>
                            </div>
                            <h2
                              className={cn(
                                'text-lg font-medium text-kangyur-dark group-hover:text-kangyur-green transition-colors',
                                title.scriptIsTibetan && 'tibetan'
                              )}
                            >
                              {title.text}
                            </h2>
                            {desc ? (
                              <p
                                className={cn(
                                  'mt-1.5 text-sm text-kangyur-dark/70 line-clamp-2',
                                  pickBilingualDisplay(
                                    isTibetan,
                                    section.description_tibetan,
                                    section.description_english
                                  ).scriptIsTibetan && 'tibetan'
                                )}
                              >
                                {desc}
                              </p>
                            ) : null}
                            {collectionName ? (
                              <p className="mt-2 text-xs text-kangyur-dark/50">
                                {t('collection') || 'Collection'}: {collectionName}
                              </p>
                            ) : null}
                          </div>
                          <ChevronRight
                            className="h-5 w-5 shrink-0 text-stone-300 group-hover:text-kangyur-orange transition-colors mt-1"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  }

                  const text = row.data;
                  const textTitle = pickBilingualDisplay(
                    isTibetan,
                    text.title?.tibetan,
                    text.title?.english
                  );
                  const sectionName = text.sub_category
                    ? pickBilingualText(
                        isTibetan,
                        text.sub_category.name_tibetan,
                        text.sub_category.name_english
                      )
                    : '';

                  return (
                    <li key={`text-${text.id}`}>
                      <Link
                        to={hrefForText(text)}
                        className="group flex gap-4 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all hover:border-kangyur-orange/35 hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-kangyur-green/10 text-kangyur-green">
                          <FileText className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                              {t('text') || 'Text'}
                            </span>
                          </div>
                          <h2
                            className={cn(
                              'text-lg font-medium text-kangyur-dark group-hover:text-kangyur-green transition-colors',
                              textTitle.scriptIsTibetan && 'tibetan'
                            )}
                          >
                            {textTitle.text}
                          </h2>
                          {text.title?.sanskrit ? (
                            <p className="mt-1 text-sm text-kangyur-dark/60 italic">{text.title.sanskrit}</p>
                          ) : null}
                          {sectionName ? (
                            <p className="mt-2 text-xs text-kangyur-dark/50 flex items-center gap-1 flex-wrap">
                              <BookOpen className="h-3.5 w-3.5 opacity-70" aria-hidden />
                              <span>
                                {t('inCatalogSection') || 'In catalog section'}: {sectionName}
                              </span>
                            </p>
                          ) : null}
                          {text.derge_id ? (
                            <p className="mt-1 text-xs text-kangyur-dark/45">
                              {t('dergeId') || 'Derge ID'}: {text.derge_id}
                            </p>
                          ) : null}
                        </div>
                        <ChevronRight
                          className="h-5 w-5 shrink-0 text-stone-300 group-hover:text-kangyur-orange transition-colors mt-1"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Search;
