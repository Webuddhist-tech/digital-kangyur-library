import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { StickyFooterShell } from '@/components/ui/molecules/Footer';
import KarchagTextCardList from '@/components/catalog/KarchagTextCardList';
import Breadcrumb from '@/components/ui/atoms/Breadcrumb';
import MainKarchagFrames from '@/components/catalog/MainKarchagFrames';
import KarchagFrame from '@/components/catalog/KarchagFrame';
import { paginateItems } from '@/utils/paginationUtils';
import useLanguage from '@/hooks/useLanguage';
import api from '@/utils/api';
import { pickBilingualDisplay, pickBilingualText } from '@/utils/localizedContent';
import KarchagSearch from '@/components/catalog/KarchagSearch';
import { Input } from '@/components/ui/atoms/input';
import { Card, CardContent } from '@/components/ui/atoms/card';
import { RichTextContent } from '@/components/ui/molecules/RichTextContent';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [selectedItem, setSelectedItem] = useState<string | null>(() => searchParams.get('item'));
  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams.get('page');
    const n = p ? Number.parseInt(p, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  const { t, isTibetan } = useLanguage();
  const isUpdatingFromUrl = useRef(false);
  const previousParamsString = useRef(searchParams.toString());
  const previousItemRef = useRef<string | null>(searchParams.get('item'));

  // Get URL parameters
  const category = searchParams.get('category');

  // Fetch karchag main category by ID when category exists in URL
  const { data: selectedMainCategory, isLoading: loadingMainCategory } = useQuery({
    queryKey: ['karchag', 'main-category', category],
    queryFn: async () => {
      if (!category) return null;
      const response = await api.getKarchagMainCategoryById(category);
      return response;
    },
    enabled: !!category && !selectedItem, // Only fetch when a main category is selected but no subcategory
  });

  // Fetch karchag subcategories for the selected main category
  const { data: karchagSubCategoriesData = [], isLoading: loadingSubCategories } = useQuery({
    queryKey: ['karchag', 'sub-categories', category],
    queryFn: async () => {
      if (!category) return [];
      const response = await api.getKarchagSubCategories({ 
        main_category_id: category,
        is_active: 'true'
      });
      return response.categories || [];
    },
    enabled: !!category && !selectedItem, // Only fetch when a main category is selected but no subcategory
  });

  // Fetch selected subcategory details when a subcategory is selected
  const { data: selectedSubCategory, isLoading: loadingSelectedSubCategory } = useQuery({
    queryKey: ['karchag', 'sub-category', selectedItem],
    queryFn: async () => {
      if (!selectedItem) return null;
      const response = await api.getKarchagSubCategoryById(selectedItem);
      return response;
    },
    enabled: !!selectedItem,
  });

  // Fetch texts for the selected subcategory if it doesn't have content
  const { data: subCategoryTextsData = [], isLoading: loadingTexts } = useQuery({
    queryKey: ['karchag', 'texts', selectedItem],
    queryFn: async () => {
      if (!selectedItem) return [];
      const response = await api.getKarchagTexts({ 
        sub_category_id: selectedItem,
        is_active: 'true'
      });
      return response.texts || [];
    },
    enabled: !!selectedItem && !!selectedSubCategory && !selectedSubCategory.content, // Only fetch texts if subcategory doesn't have content
    staleTime: 0, // Always refetch when subcategory changes
    gcTime: 0, // Don't cache texts between different subcategories
  });

  // Parse URL parameters on component mount
  useEffect(() => {
    const currentParamsString = searchParams.toString();
    
    // Only update state if URL params actually changed
    if (currentParamsString === previousParamsString.current) {
      return;
    }
    
    previousParamsString.current = currentParamsString;
    
    const queryParam = searchParams.get('q') ?? '';
    const itemParam = searchParams.get('item');
    const pageParam = searchParams.get('page');
    
    // Reset or set search query
    const newQuery = queryParam || '';
    const newItem = itemParam || null;
    
    // If the item changed, reset to page 1, otherwise use the page from URL
    const itemChanged = newItem !== previousItemRef.current;
    const newPage = itemChanged ? 1 : (pageParam ? Number.parseInt(pageParam, 10) : 1);
    
    // Update the ref for next comparison
    previousItemRef.current = newItem;
    
    // Mark that we're updating from URL to prevent the other useEffect from running
    isUpdatingFromUrl.current = true;
    
    // Update state
    setSearchQuery(newQuery);
    setSelectedItem(newItem);
    setCurrentPage(newPage);
    
    // Reset the flag after state updates complete
    // Use setTimeout to ensure it happens after React's state updates are processed
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  // Update ref when selectedItem changes (for tracking item changes)
  useEffect(() => {
    if (!isUpdatingFromUrl.current) {
      previousItemRef.current = selectedItem;
    }
  }, [selectedItem]);

  // Update URL when search, selection, or page changes (but not when updating from URL)
  useEffect(() => {
    // Skip if we're currently updating from URL to prevent infinite loops
    if (isUpdatingFromUrl.current) {
      return;
    }
    
    const newParams = new URLSearchParams();
    
    // Preserve category parameter if it exists
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      newParams.set('category', categoryParam);
    }
    
    // Set search query (only if we're on catalog page with selected item, not global search)
    if (searchQuery && selectedItem) {
      newParams.set('q', searchQuery);
    }
    
    // Set selected item
    if (selectedItem) {
      newParams.set('item', selectedItem);
    }

    const highlightParam = searchParams.get('highlightText');
    if (highlightParam) {
      newParams.set('highlightText', highlightParam);
    }
    
    // Set current page
    if (currentPage > 1) {
      newParams.set('page', currentPage.toString());
    }
    
    // Only update if the params string is different to prevent infinite loops
    const newParamsString = newParams.toString();
    
    if (newParamsString !== previousParamsString.current) {
      previousParamsString.current = newParamsString;
      setSearchParams(newParams);
    }
  }, [searchQuery, selectedItem, currentPage, searchParams, setSearchParams]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Get selected item details from fetched subcategory
  const selectedItemDetails = selectedSubCategory ? {
    id: selectedSubCategory.id,
    title: {
      tibetan: selectedSubCategory.name_tibetan || '',
      english: selectedSubCategory.name_english || ''
    },
    content: selectedSubCategory.content,
    only_content: selectedSubCategory.only_content
  } : null;

  // Transform texts from API to the format expected by TextCard
  const transformTextsForDisplay = (texts: any[]) => {
    return texts.map((text) => {
      let pages: number | undefined;
      if (text.yeshe_de_volume_length) {
        const length = Number.parseInt(text.yeshe_de_volume_length, 10);
        if (!Number.isNaN(length) && length > 0) {
          pages = length;
        }
      }
      return {
        id: text.id,
        title: {
          tibetan: text.tibetan_title || '',
          english: text.english_title || '',
          sanskrit: text.sanskrit_title || undefined,
          chinese: text.chinese_title || undefined
        },
        category: selectedItemDetails?.title.english || '',
        derge_id:text.derge_id ||undefined,
        volume: text.yeshe_de_volume_number || undefined,
        yana:text.yana||undefined,
        summary:{
          tibetan:text?.summary?.summary_text_tibetan,
          english:text?.summary?.summary_text_english
        }

      };
    });
  };

  // Filter texts based on search query
  const filterTexts = (texts: any[], query: string) => {
    if (!query.trim()) return texts;
    
    const searchTerm = query.toLowerCase().trim();
    return texts.filter((text) => {
      const titleEnglish = text.title?.english?.toLowerCase() || '';
      const titleTibetan = text.title?.tibetan?.toLowerCase() || '';
      const titleSanskrit = text.title?.sanskrit?.toLowerCase() || '';
      const titleChinese = text.title?.chinese?.toLowerCase() || '';
      const dergeId = text.derge_id?.toLowerCase() || '';
      const volume = text.volume?.toString() || '';
      const yana = text.yana?.toLowerCase() || '';
      const summaryEnglish = text.summary?.english?.toLowerCase() || '';
      const summaryTibetan = text.summary?.tibetan?.toLowerCase() || '';
      
      return (
        titleEnglish.includes(searchTerm) ||
        titleTibetan.includes(searchTerm) ||
        titleSanskrit.includes(searchTerm) ||
        titleChinese.includes(searchTerm) ||
        dergeId.includes(searchTerm) ||
        volume.includes(searchTerm) ||
        yana.includes(searchTerm) ||
        summaryEnglish.includes(searchTerm) ||
        summaryTibetan.includes(searchTerm)
      );
    });
  };

  const ITEMS_PER_PAGE = 10;
  
  // Get filtered and paginated text entries for the selected item
  const getTextCardItems = () => {
    const transformedTexts = transformTextsForDisplay(subCategoryTextsData);
    const filteredTexts = filterTexts(transformedTexts, searchQuery);
    return paginateItems(filteredTexts, currentPage, ITEMS_PER_PAGE);
  };

  // Handle search query change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handler for selecting an item
  const handleItemSelect = (id: string) => {
    setSelectedItem(id === selectedItem ? null : id);
    setCurrentPage(1);
  };

  // Renders a catalog item with its children
  const renderCatalogItem = (item: any) => {
    const isSelected = item.id === selectedItem;
    return (
      <div key={item.id} className="mb-4">
        <div 
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-indigo-100 border-indigo-300' : 'hover:bg-gray-50'
          }`} 
          onClick={() => handleItemSelect(item.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3
                className={`text-xl mb-1 ${
                  pickBilingualDisplay(isTibetan, item.title.tibetan, item.title.english).scriptIsTibetan
                    ? 'tibetan'
                    : 'font-medium text-gray-700'
                }`}
              >
                {pickBilingualText(isTibetan, item.title.tibetan, item.title.english)}
              </h3>
              {item.description && (
                <p className="text-gray-600 text-sm mt-2">{item.description}</p>
              )}
            </div>
            {item.count !== undefined && (
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {item.count} {item.count === 1 ? (t('text') || 'text') : (t('texts') || 'texts')}
              </span>
            )}
          </div>
        </div>
        
        {isSelected && item.children && item.children.length > 0 && (
          <div className="ml-6 mt-2 border-l-2 border-indigo-200 pl-4">
            {item.children.map((child: any) => renderCatalogItem(child))}
          </div>
        )}
      </div>
    );
  };

  // Get paginated data for display
  const {
    items: paginatedItems,
    pagination
  } = selectedItem && selectedSubCategory && !selectedSubCategory.content
    ? getTextCardItems() 
    : {
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

  const highlightTextId = searchParams.get('highlightText');

  useEffect(() => {
    if (!highlightTextId || !selectedItem || !selectedSubCategory || selectedSubCategory.content) return;
    if (loadingTexts) return;
    const transformedTexts = transformTextsForDisplay(subCategoryTextsData);
    const filteredTexts = filterTexts(transformedTexts, searchQuery);
    const idx = filteredTexts.findIndex((text) => text.id === highlightTextId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    setCurrentPage((prev) => (prev !== targetPage ? targetPage : prev));
  }, [
    highlightTextId,
    selectedItem,
    selectedSubCategory,
    subCategoryTextsData,
    searchQuery,
    loadingTexts,
  ]);

  const hasHighlightOnPage =
    !!highlightTextId && paginatedItems.some((text: { id: string }) => text.id === highlightTextId);

  useEffect(() => {
    if (!highlightTextId || !hasHighlightOnPage) return;
    const frame = globalThis.requestAnimationFrame(() => {
      document.getElementById(`karchag-text-${highlightTextId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return () => globalThis.cancelAnimationFrame(frame);
  }, [highlightTextId, hasHighlightOnPage, currentPage]);

  const loading = loadingMainCategory || loadingSubCategories || loadingSelectedSubCategory || loadingTexts;

  const mainCategoryForBreadcrumb =
    selectedMainCategory ?? selectedSubCategory?.main_category ?? null;

  if (loading && category) {
    return (
      <StickyFooterShell className="w-full bg-white">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-kangyur-dark/60">{t('loading') || 'Loading categories...'}</p>
        </div>
      </StickyFooterShell>
    );
  }

  return (
    <StickyFooterShell className="w-full bg-white">
      {/* Show CatalogSearch on main category and subcategory sections (only if no active search query) */}
      {category && !searchQuery && !selectedItem && (
        <KarchagSearch />
      )}

      {/* Main Karchag Frames - show only when no search, selected item, or category */}
      {!searchQuery && !selectedItem && !category && (
        <MainKarchagFrames />
      )}

      {/* Subcategories - show when a main category is selected but no specific subcategory is selected */}
      {category && !searchQuery && !selectedItem && selectedMainCategory && (
        <div className="container mx-auto px-4 pt-8 pb-12 min-h-[60vh]">
          <div className="mb-8">
            <div className="mb-4">
              <Breadcrumb 
                items={[
                  { label: t('catalog') || 'Catalog', href: '/catalog' },
                  {
                    label: pickBilingualText(isTibetan, selectedMainCategory.name_tibetan, selectedMainCategory.name_english),
                    // No href for current page
                  }
                ]}
                showHome={false}
              />
            </div>
            <h2
              className={`text-3xl font-bold text-center mb-2 ${
                pickBilingualDisplay(isTibetan, selectedMainCategory.name_tibetan, selectedMainCategory.name_english).scriptIsTibetan
                  ? 'tibetan'
                  : ''
              }`}
            >
              {pickBilingualText(isTibetan, selectedMainCategory.name_tibetan, selectedMainCategory.name_english)}
            </h2>
          
          </div>
          
          {karchagSubCategoriesData && karchagSubCategoriesData.length > 0 ? (
            <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-24 flex-wrap">
              {[...karchagSubCategoriesData]
                .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                .map((subcategory: any) => (
                <KarchagFrame
                  key={subcategory.id}
                  label={{
                    tibetan: subcategory.name_tibetan || '',
                    english: subcategory.name_english || ''
                  }}
                  fontSize="xx-large"
                  link={`/catalog?category=${category}&item=${subcategory.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p>{t('noCatalogSections') || 'No catalog sections are available for this collection yet.'}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Selected Subcategory or Search Results */}
      {selectedItem || searchQuery ? (
        <div className="container mx-auto px-4 pt-8 pb-12 min-h-[90vh] relative">
          {/* Selected Subcategory Header with Breadcrumb */}
          {selectedItem && selectedItemDetails && (
            <>
              <div className="mb-4">
                <Breadcrumb 
                  items={[
                    { label: t('catalog') || 'Catalog', href: '/catalog' },
                    ...(mainCategoryForBreadcrumb ? [{
                      label: pickBilingualText(isTibetan, mainCategoryForBreadcrumb.name_tibetan, mainCategoryForBreadcrumb.name_english),
                      href: `/catalog?category=${mainCategoryForBreadcrumb.id}`
                    }] : []),
                    ...(selectedSubCategory ? [{
                      label: pickBilingualText(isTibetan, selectedSubCategory.name_tibetan, selectedSubCategory.name_english)
                      // No href for current page
                    }] : [])
                  ]}
                  showHome={false}
                />
              </div>
              <div className="sticky flex items-center flex-col md:flex-row justify-between top-16 z-10 bg-white py-4 mb-8 border-b border-gray-200">
                <h2
                  className={`text-3xl font-bold text-center mb-4 ${
                    pickBilingualDisplay(isTibetan, selectedItemDetails.title.tibetan, selectedItemDetails.title.english).scriptIsTibetan
                      ? 'tibetan'
                      : ''
                  }`}
                >
                  {pickBilingualText(isTibetan, selectedItemDetails.title.tibetan, selectedItemDetails.title.english)}
                </h2>
                
                {/* Search Input for filtering texts */}
                {selectedSubCategory && !selectedSubCategory.content && (
                  <div className="">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="search"
                        placeholder={t('searchTexts') || 'Search texts...'}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {searchQuery && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          type="button"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          

          {/* Selected subcategory content or text list or search results */}
          {(() => {
            // Render subcategory content or text list
            if (selectedItem && selectedSubCategory) {
              if (selectedSubCategory.content) {
                // Same reader font and type as the sutra text tab.
                const scriptIsTibetan = /[\u0F00-\u0FFF]/.test(selectedSubCategory.content);
                return (
                  <Card className="border border-kangyur-orange/10 rounded-xl shadow-sm min-h-[60vh]">
                    <CardContent
                      className="p-4 sm:p-6"
                      style={{ fontFamily: scriptIsTibetan ? 'CustomTibetan' : '' }}
                    >
                      <RichTextContent
                        value={selectedSubCategory.content}
                        tibetan={scriptIsTibetan}
                        className="text-base sm:text-lg leading-relaxed text-gray-600 break-words"
                      />
                    </CardContent>
                  </Card>
                );
              } else {
                // Display text list if subcategory doesn't have content
                if (loadingTexts) {
                  return null;
                }
                if (paginatedItems.length > 0) {
                  return (
                    <>
                      {searchQuery && (
                        <div className="mb-4 text-center text-sm text-gray-600">
                          {pagination.totalItems} {pagination.totalItems === 1 ? 'text' : 'texts'} found
                        </div>
                      )}
                      <KarchagTextCardList
                        items={paginatedItems}
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        itemsPerPage={pagination.itemsPerPage}
                        onPageChange={handlePageChange}
                        highlightTextId={highlightTextId}
                      />
                    </>
                  );
                }
                return (
                  <div className="text-center text-gray-600 py-12">
                    <p>
                      {searchQuery 
                        ? (t('noTextsFound') || `No texts found matching "${searchQuery}"`)
                        : (t('noTextsInSection') || 'No texts are listed in this catalog section yet.')
                      }
                    </p>
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
                      >
                        {t('clearSearch') || 'Clear search'}
                      </button>
                    )}
                  </div>
                );
              }
            }
            
            return null;
          })()}
        </div>
      ) : null}
    </StickyFooterShell>
  );
};

export default Catalog;
