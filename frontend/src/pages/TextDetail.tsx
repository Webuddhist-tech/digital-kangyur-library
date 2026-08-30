import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StickyFooterShell } from '@/components/ui/molecules/Footer';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/atoms/tabs";
import Breadcrumb from '@/components/ui/atoms/Breadcrumb';
import useLanguage from '@/hooks/useLanguage';
import api from '@/utils/api';
import { pickBilingualDisplay, pickBilingualText } from '@/utils/localizedContent';



function link_prefix(link: string) {
  if (link.startsWith('https://') || link.startsWith('http://')) {
    return link;
  }
  return 'https://' + link;
}

// Mapping section IDs to translation keys
const sectionTitleMap = {
  'translation-homage': 'translationHomage' as const,
  'purpose': 'purpose' as const,
  'summary': 'summary' as const,
  'word-meaning': 'wordMeaning' as const,
  'connection': 'connection' as const,
  'questions-answers': 'objectionAndReply' as const,
  'colophon': 'colophon' as const,
};

// Mapping metadata keys to translation keys
const metadataLabelMap: Record<string, string> = {
  'tibetan-title': 'tibetanTitle',
  'sanskrit-title': 'sanskritTitle',
  'chinese-title': 'chineseTitle',
  'english-title': 'englishTitle',
  'alternative-title': 'alternativeTitle',
  'derge-id': 'dergeId',
  'yeshe-de-id': 'yesheDeId',
  'yeshe-de-volume': 'yesheDeVolume',
  'yeshe-de-volume-length': 'yesheDeVolumeLength',
  'pedurma-volume-number': 'pedurmaVolumeNumber',
  'chapter-number': 'chapter',
  'bampo-number': 'bampo',
  'page-count': 'pageCount',
  'interpretation': 'interpretation',
  'pitaka-type': 'pitaka',
  'pecing-link': 'pecingLink',
  'narthang-link': 'narthangLink',
  'sermon': 'sermon',
  'yana': 'yana',
  'translation-period': 'translationPeriod',
  
};

// Mapping of backend values to translation keys
const valueTranslationMap: Record<string, Record<string, string>> = {
  'sermon': {
    'First Sermon': 'sermonFirst',
    'first sermon': 'sermonFirst',
    'Second Sermon': 'sermonSecond',
    'second sermon': 'sermonSecond',
    'Third Sermon': 'sermonThird',
    'third sermon': 'sermonThird',
  },
  'yana': {
    'Hinayana': 'yanaHinayana',
    'hinayana': 'yanaHinayana',
    'Mahayana': 'yanaMahayana',
    'mahayana': 'yanaMahayana',
    'Vajrayana': 'yanaVajrayana',
    'vajrayana': 'yanaVajrayana',
  },
  'translation-period': {
    'Early Translation': 'translationPeriodEarly',
    'early translation': 'translationPeriodEarly',
    'New Translation': 'translationPeriodNew',
    'new translation': 'translationPeriodNew',
  },
  'interpretation': {
    'Provisional': 'interpretationProvisional',
    'provisional': 'interpretationProvisional',
    'Definitive': 'interpretationDefinitive',
    'definitive': 'interpretationDefinitive',
  },
  'pitaka-type': {
    'Vinaya Pitaka': 'pitakaVinaya',
    'vinaya pitaka': 'pitakaVinaya',
    'Sutra Pitaka': 'pitakaSutra',
    'sutra pitaka': 'pitakaSutra',
    'Abhidharma Pitaka': 'pitakaAbhidharma',
    'abhidharma pitaka': 'pitakaAbhidharma',
  },
};

// Function to map backend values to translation keys
const getValueTranslationKey = (key: string, value: string): string | null => {
  const trimmedValue = value.trim();
  const lowerValue = trimmedValue.toLowerCase();
  const keyMap = valueTranslationMap[key];
  
  if (!keyMap) return null;
  
  // Try exact match first
  if (keyMap[trimmedValue]) return keyMap[trimmedValue];
  
  // Try case-insensitive match
  if (keyMap[lowerValue]) return keyMap[lowerValue];
  
  // For translation period, check if value contains keywords
  if (key === 'translation-period') {
    if (lowerValue.includes('early')) return 'translationPeriodEarly';
    if (lowerValue.includes('new')) return 'translationPeriodNew';
  }
  
  return null;
};

// MetadataSection component
const MetadataSection = ({ title, group, metadata, t }: { title: string; group: string; metadata: any[]; t: (key: string) => string }) =>{
  const filteredMetadata = metadata.filter((item: any) => item.group === group);
  const showTitle=filteredMetadata.length > 0;
  return (
  <div className="w-full space-y-5">
    {showTitle && <h3 className="text-xl font-semibold text-kangyur-maroon mb-4">{title}</h3>}
    <table className="w-full border-collapse">
      <tbody>
        {filteredMetadata.map((item: any) => {
          const translationKey = getValueTranslationKey(item.key, item.value);
          const displayValue = translationKey ? t(translationKey) : item.value;
          return (
            <tr key={item.key} className="border-b border-gray-200">
              <td className="py-3 pr-4 font-medium text-gray-700 align-top w-1/3 capitalize">{t(metadataLabelMap[item.key] || item.key)}:</td>
              <td className={`py-3 text-gray-600 ${group === 'titles' && (item.key === 'tibetan-title' || item.key === 'sanskrit-title') ? 'tibetan text-lg' : ''}`}>
                {metadataLabelMap[item.key] === 'pecingLink' || metadataLabelMap[item.key] === 'narthangLink' ?(
                  <a href={link_prefix(item.value)} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {t('link')}
                  </a>
                ):displayValue}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}

const TextDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('metadata');
  const { isTibetan, t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const container = scrollContainerRef.current;
    const el = sectionRefs.current[sectionId];
    if (!container || !el) return;
    // Scroll only the inner reader pane - el.scrollIntoView() would also scroll the page itself.
    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: offset, behavior: 'smooth' });
  };

  // Fetch text data using React Query
  const { data: textData, isLoading: loadingText, error: textError } = useQuery({
    queryKey: ['text', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('No text ID provided');
      }

      const response = await api.getTextById(id);
      
      // Transform backend response to component format
      // Build metadata from text fields
      const metadata = [
        // Titles section
        { key: 'tibetan-title', value: response.tibetan_title?.trim() || '', group: 'titles' },
        { key: 'sanskrit-title', value: response.sanskrit_title?.trim() || '', group: 'titles' },
        { key: 'chinese-title', value: response.chinese_title?.trim() || '', group: 'titles' },
        { key: 'english-title', value: response.english_title?.trim() || '', group: 'titles' },
        { key: 'alternative-title', value: response.alternative_title?.trim() || '', group: 'titles' },
        // Catalog information
        { key: 'pedurma-volume-number', value: response.pedurma_volume_number?.trim() || '', group: 'catalog' },
        { key: 'derge-id', value: response.derge_id?.trim() || '', group: 'catalog' },
        { key: 'yeshe-de-id', value: response.yeshe_de_id?.trim() || '', group: 'catalog' },
        { key: 'yeshe-de-volume', value: response.yeshe_de_volume_number?.trim() || '', group: 'catalog' },
        { key: 'yeshe-de-volume-length', value: response.yeshe_de_volume_length?.trim() || '', group: 'catalog' },
        { key: 'chapter-number', value: response.chapter_number?.toString() || '', group: 'catalog' },
        { key: 'bampo-number', value: response.bampo_number?.toString() || '', group: 'catalog' },
        { key: 'page-count', value: response.page_count?.toString() || '', group: 'catalog' },
        { key: 'pecing-link', value: response.pecing_link?.trim() || '', group: 'catalog' },
        { key: 'narthang-link', value: response.narthang_link?.trim() || '', group: 'catalog' },
        // Content information
        { key: 'interpretation', value: response.interpretation?.trim() || '', group: 'content' },
        { key: 'pitaka-type', value: response.pitaka_type?.trim() || '', group: 'content' },
        { key: 'sermon', value: response.sermon?.trim() || '', group: 'content' },
        { key: 'yana', value: response.yana?.trim() || '', group: 'content' },
        { key: 'translation-period', value: response.translation_period?.trim() || '', group: 'content' },
      ].filter(item => item.value); // Only include items with values
      
      const transformedData = {
        id: response.id,
        sub_category_id: response.sub_category_id,
        title: {
          tibetan: response.tibetan_title?.trim() || '',
          english: response.english_title?.trim() || ''
        },
        pdf_url: response.pdf_url,
        metadata,
      };
      
      return transformedData;
    },
    enabled: !!id,
    retry: 1,
  });

  const hasMetadata = (textData?.metadata?.length || 0) > 0;

  // Fetch subcategory data when text data is loaded
  const { data: subCategoryData } = useQuery({
    queryKey: ['subcategory', textData?.sub_category_id],
    queryFn: async () => {
      if (!textData?.sub_category_id) return null;
      return await api.getKarchagSubCategoryById(textData.sub_category_id);
    },
    enabled: !!textData?.sub_category_id,
  });

  // Fetch main category data when subcategory data is loaded
  const { data: mainCategoryData } = useQuery({
    queryKey: ['maincategory', subCategoryData?.main_category_id],
    queryFn: async () => {
      if (!subCategoryData?.main_category_id) return null;
      return await api.getKarchagMainCategoryById(subCategoryData.main_category_id);
    },
    enabled: !!subCategoryData?.main_category_id,
  });

  // Fetch summary data when summary tab is active
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['text-summary', id, isTibetan ? 'bod' : 'en'],
    queryFn: async () => {
      if (!id) {
        return null;
      }

      const response = await api.getKarchagTextSummary(id);
      
      if (!response) {
        return null;
      }

      const sectionDefs = [
        { id: 'translation-homage' as const, tib: response.translation_homage_tibetan, en: response.translation_homage_english },
        { id: 'purpose' as const, tib: response.purpose_tibetan, en: response.purpose_english },
        { id: 'summary' as const, tib: response.summary_text_tibetan, en: response.summary_text_english },
        { id: 'word-meaning' as const, tib: response.word_meaning_tibetan, en: response.word_meaning_english },
        { id: 'connection' as const, tib: response.connection_tibetan, en: response.connection_english },
        { id: 'questions-answers' as const, tib: response.question_answers_tibetan, en: response.question_answers_english },
        { id: 'colophon' as const, tib: response.colophon_tibetan, en: response.colophon_english },
      ];
      const sections = sectionDefs
        .map(({ id, tib, en }) => {
          const { text, scriptIsTibetan } = pickBilingualDisplay(isTibetan, tib, en);
          return { id, content: text, scriptIsTibetan };
        })
        .filter((section) => section.content);
      
      return { sections };
    },
    enabled: !!id && activeTab === 'summary',
    retry: 1,
  });

  // Metadata sits first in the reader, but the default focus is the first real text section -
  // only fall back to metadata when there's no text content at all.
  const defaultSectionId = summaryData?.sections?.[0]?.id ?? (hasMetadata ? 'metadata' : '');
  const currentSection = activeSection || defaultSectionId;

  // Land the reader on the first real text section rather than sitting on metadata by default
  useEffect(() => {
    if (activeSection || !defaultSectionId || defaultSectionId === 'metadata') return;
    const container = scrollContainerRef.current;
    const el = sectionRefs.current[defaultSectionId];
    if (!container || !el) return;
    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTop = offset;
  }, [defaultSectionId, activeTab]);

  // Keep the sidebar highlight in sync with whichever section is scrolled into view
  useEffect(() => {
    const container = scrollContainerRef.current;
    const sectionIds = [
      ...(hasMetadata ? ['metadata'] : []),
      ...((summaryData?.sections || []).map((section: any) => section.id)),
    ];
    if (!container || sectionIds.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topEntry = visible[0];
        if (topEntry) {
          const sectionId = topEntry.target.getAttribute('data-section-id');
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      },
      { root: container, rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    sectionIds.forEach((sectionId) => {
      const el = sectionRefs.current[sectionId];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [summaryData, hasMetadata]);

  const loading = loadingText || (activeTab === 'summary' && loadingSummary);
  
  // Extract error message
  let error: string | null = null;
  if (textError) {
    error = textError instanceof Error ? textError.message : 'Failed to load text';
  }

  if (loading) {
    return (
      <StickyFooterShell>
        <main className="flex-1 pt-10 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-12">
              <div className="text-lg">{t('loading')}</div>
            </div>
          </div>
        </main>
      </StickyFooterShell>
    );
  }

  if (error || !textData) {
    return (
      <StickyFooterShell>
        <main className="flex-1 pt-10 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-12">
              <div className="text-lg text-red-600">{error || t('textNotFound')}</div>
            </div>
          </div>
        </main>
      </StickyFooterShell>
    );
  }

  // Build breadcrumb dynamically from category hierarchy
  const breadcrumbItems = [
    { label: t('catalog') || 'Catalog', href: '/catalog' },
    ...(mainCategoryData ? [{
      label: pickBilingualText(isTibetan, mainCategoryData.name_tibetan, mainCategoryData.name_english),
      href: `/catalog?category=${mainCategoryData.id}`
    }] : []),
    ...(subCategoryData ? [{
      label: pickBilingualText(isTibetan, subCategoryData.name_tibetan, subCategoryData.name_english),
      href: `/catalog?category=${mainCategoryData?.id}&item=${subCategoryData.id}`
    }] : []),
    {
      label: pickBilingualText(isTibetan, textData?.title?.tibetan, textData?.title?.english),
    }
  ];

  return (
    <StickyFooterShell style={{ fontFamily: isTibetan ? 'CustomTibetan' : '' }}>
      <main className="flex-1 pt-10 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- Breadcrumb navigation --- */}
          <div className="mb-4">
            {/* Pass showHome={false} to remove "Home" */}
            <Breadcrumb items={breadcrumbItems} showHome={false} />
          </div>
          
          {/* Text Title */}
          <div className="mb-6">
            <h1
              className={cn(
                'text-4xl font-bold text-primary',
                pickBilingualDisplay(isTibetan, textData?.title?.tibetan, textData?.title?.english).scriptIsTibetan && 'tibetan'
              )}
            >
              {pickBilingualText(isTibetan, textData?.title?.tibetan, textData?.title?.english)}
            </h1>
          </div>
          
          <div>
            <Card className="border border-kangyur-orange/10 rounded-xl shadow-sm">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-3 border-b ">
                    <TabsTrigger value="metadata" className="rounded-none text-md">
                      {t('metadata')}
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="rounded-none text-md">
                      {t('text')}
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="rounded-none text-md">
                      {t('yesheDeSourceText')}
                    </TabsTrigger>
                  </TabsList>
                  {/* Tab 1: Metadata */}
                  <TabsContent value="metadata" className="p-6">
                    <div className="flex flex-col gap-8">
                      {/* Titles section */}
                      <MetadataSection title={t('titlesInMultipleLanguages')} group="titles" metadata={textData?.metadata || []} t={t} />
                      
                      {/* Catalog information section */}
                      <MetadataSection title={t('catalogInformation')} group="catalog" metadata={textData?.metadata || []} t={t} />
                      
                      {/* Content information section */}
                      <MetadataSection title={t('contentInformation')} group="content" metadata={textData?.metadata || []} t={t} />
                      
                      {/* General metadata section */}
                      {/* <MetadataSection title={t('generalInformation')} group="general" metadata={textData?.metadata || []} t={t} /> */}
                    </div>
                  </TabsContent>
                  {/* Tab 2: Summary - New layout with vertical nav and text reader */}
                  <TabsContent value="summary" className="p-0">
                    {loadingSummary && (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-lg">{t('loadingSummary')}</div>
                      </div>
                    )}
                    {!loadingSummary && (!summaryData?.sections || summaryData.sections.length === 0) && !hasMetadata && (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-lg text-gray-500">{t('noSummaryAvailable')}</div>
                      </div>
                    )}
                    {!loadingSummary && (hasMetadata || (summaryData?.sections && summaryData.sections.length > 0)) && (
                      <div className="flex flex-col md:flex-row h-auto md:h-[70vh] overflow-hidden">
                        {/* Left Navigation Bar */}
                        <div className="md:w-1/4 lg:w-1/5 border-b md:border-b-0 md:border-r border-border bg-muted/30 max-h-56 md:max-h-none md:h-full overflow-y-auto shrink-0">
                          <div className="p-3 sm:p-4">

                            <nav className="space-y-2">
                              {hasMetadata && (
                                <button
                                  onClick={() => scrollToSection('metadata')}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold capitalize",
                                    isTibetan && "tibetan",
                                    currentSection === 'metadata'
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {t('metadata')}
                                </button>
                              )}
                              {(summaryData?.sections || []).map((section: any) => (
                                <button
                                  key={section.id}
                                  onClick={() => scrollToSection(section.id)}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold capitalize",
                                    isTibetan && "tibetan",
                                    currentSection === section.id
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {t(sectionTitleMap[section.id as keyof typeof sectionTitleMap])}
                                </button>
                              ))}
                            </nav>
                          </div>
                        </div>

                        {/* Right Text Reader - metadata + all sections rendered continuously, scrolls independently of the page */}
                        <div className="flex-1 flex flex-col min-h-0">
                          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                            {hasMetadata && (
                              <div
                                ref={(el) => { sectionRefs.current['metadata'] = el; }}
                                data-section-id="metadata"
                                className="space-y-4 scroll-mt-4 pb-8 mb-8 border-b border-border"
                              >
                                <h3 className="text-lg sm:text-xl font-semibold text-kangyur-maroon mb-3 sm:mb-4 capitalize">
                                  {t('metadata')}
                                </h3>
                                <div className="flex flex-col gap-8">
                                  <MetadataSection title={t('titlesInMultipleLanguages')} group="titles" metadata={textData?.metadata || []} t={t} />
                                  <MetadataSection title={t('catalogInformation')} group="catalog" metadata={textData?.metadata || []} t={t} />
                                  <MetadataSection title={t('contentInformation')} group="content" metadata={textData?.metadata || []} t={t} />
                                </div>
                              </div>
                            )}
                            {(summaryData?.sections || []).map((section: any) => (
                              <div
                                key={section.id}
                                ref={(el) => { sectionRefs.current[section.id] = el; }}
                                data-section-id={section.id}
                                className="space-y-4 scroll-mt-4 pb-8 mb-8 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                              >
                                <h3
                                  className={cn(
                                    "text-lg sm:text-xl font-semibold text-kangyur-maroon mb-3 sm:mb-4 capitalize",
                                    isTibetan && "tibetan"
                                  )}
                                >
                                  {t(sectionTitleMap[section.id as keyof typeof sectionTitleMap])}
                                </h3>
                                <div
                                  className={cn(
                                    'text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-line break-words',
                                    section.scriptIsTibetan && 'tibetan'
                                  )}
                                >
                                  {section.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  {/* Tab 3: PDF - Embedded Google Drive preview */}
                  <TabsContent value="pdf" className="p-0">
                    {textData?.pdf_url ? (
                      <div className="h-[60vh] sm:h-[70vh]">
                        <iframe
                          title={t('pdf')}
                          src={textData.pdf_url}
                          className="w-full h-full border-0"
                          allow="autoplay"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-lg text-gray-500">{t('noPdfAvailable')}</div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </StickyFooterShell>
  );
};

export default TextDetail;
