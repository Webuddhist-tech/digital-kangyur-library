import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Card } from '@/components/ui/atoms/card';
import { Edit, Search, Plus } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import Breadcrumb from '@/components/ui/atoms/Breadcrumb';
import { CategoryForm } from './CategoryForm';
import { TextCard } from './TextCard';
import { TextEditModal } from './TextEditModal';
import { FootnoteableTextarea } from '@/components/admin/texts/FootnoteableTextarea';
import { FootnoteText } from '@/components/ui/molecules/FootnoteText';
import { useLanguage } from '@/hooks/useLanguage';
import { Footnote, getFootnotes, repositionFootnote, subscribeFootnotes } from '@/utils/footnotes';

function newTextDraft(subCategoryId: string) {
  return {
    sub_category_id: subCategoryId,
    derge_id: '',
    yeshe_de_id: '',
    tibetan_title: '',
    chinese_title: '',
    sanskrit_title: '',
    english_title: '',
    alternative_title: '',
    chapter_number: '',
    bampo_number: '',
    page_count: '',
    interpretation: '',
    pitaka_type: '',
    pedurma_volume_number: '',
    sermon: '',
    yana: '',
    translation_period: '',
    yeshe_de_volume_number: '',
    yeshe_de_volume_length: '',
    pecing_link: '',
    narthang_link: '',
    pdf_url: '',
    order_index: 0,
    is_active: true,
  };
}

function toKarchagTextApiPayload(fd: any, subCategoryId: string) {
  return {
    sub_category_id: subCategoryId,
    derge_id: fd.derge_id,
    yeshe_de_id: fd.yeshe_de_id,
    tibetan_title: fd.tibetan_title,
    chinese_title: fd.chinese_title,
    sanskrit_title: fd.sanskrit_title,
    english_title: fd.english_title,
    alternative_title: fd.alternative_title,
    chapter_number: fd.chapter_number,
    bampo_number: fd.bampo_number,
    page_count: fd.page_count,
    interpretation: fd.interpretation,
    pitaka_type: fd.pitaka_type,
    pedurma_volume_number: fd.pedurma_volume_number,
    sermon: fd.sermon,
    yana: fd.yana,
    translation_period: fd.translation_period,
    yeshe_de_volume_number: fd.yeshe_de_volume_number,
    yeshe_de_volume_length: fd.yeshe_de_volume_length,
    pecing_link: fd.pecing_link,
    narthang_link: fd.narthang_link,
    pdf_url: fd.pdf_url,
    order_index: fd.order_index,
    is_active: fd.is_active,
  };
}

export const SubCategoryView: React.FC = () => {
  const { mainId, subId } = useParams<{ mainId?: string; subId?: string }>();
  const queryClient = useQueryClient();
  const { t, isTibetan } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingText, setEditingText] = useState<any>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isTextEditModalOpen, setIsTextEditModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('edit');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState('');

  const { data: mainCategoryData } = useQuery({
    queryKey: ['karchag', 'main-category', mainId],
    queryFn: async () => {
      if (!mainId) throw new Error('Main ID is required');
      const res = await api.getKarchagMainCategoryById(mainId);
      return res;
    },
    enabled: !!mainId,
  });

  const { data: subCategoryData, isLoading: isLoadingSub } = useQuery({
    queryKey: ['karchag', 'sub-category', subId],
    queryFn: async () => {
      if (!subId) throw new Error('Sub ID is required');
      const res = await api.getKarchagSubCategoryById(subId);
      return res;
    },
    enabled: !!subId,
  });

  const { data: textsData, isLoading: isLoadingTexts } = useQuery({
    queryKey: ['karchag', 'texts', subId],
    queryFn: async () => {
      const res = await api.getKarchagTexts({ sub_category_id: subId });
      return res.texts || [];
    },
    enabled: !!subId,
  });

  const { data: mainCategoriesData } = useQuery({
    queryKey: ['karchag', 'main-categories'],
    queryFn: async () => {
      const res = await api.getKarchagMainCategories();
      return res.categories || [];
    },
  });

  const { data: subCategoriesData } = useQuery({
    queryKey: ['karchag', 'sub-categories'],
    queryFn: async () => {
      const res = await api.getKarchagSubCategories();
      return res.categories || [];
    },
  });

  const mainCategory = mainCategoryData;
  const subCategory = subCategoryData;
  const texts = textsData || [];
  const mainCategories = mainCategoriesData || [];
  const subCategories = subCategoriesData || [];
  const isLoading = isLoadingSub || isLoadingTexts;

  const isContentOnly = !!subCategory?.only_content;

  const [contentFootnotes, setContentFootnotes] = useState<Footnote[]>([]);
  useEffect(() => {
    if (!subCategory?.id) {
      setContentFootnotes([]);
      return;
    }
    const load = () => setContentFootnotes(getFootnotes(subCategory.id, 'content'));
    load();
    return subscribeFootnotes(load);
  }, [subCategory?.id]);

  const updateSubCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateKarchagSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'sub-categories'] });
      queryClient.invalidateQueries({ queryKey: ['karchag', 'sub-category', subId] });
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      setIsEditingContent(false);
      setContentDraft('');
      toast.success('Subcategory updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating sub category:', error);
      toast.error('Error updating category. Please try again.');
    },
  });


  const updateTextMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateKarchagText(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'texts'] });
      toast.success('Text updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating text:', error);
      toast.error(error?.message || 'Error updating text. Please try again.');
    },
  });

  const deleteTextMutation = useMutation({
    mutationFn: (id: string) => api.deleteKarchagText(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'texts'] });
      toast.success('Text deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting text:', error);
      toast.error(error?.message || 'Error deleting text. Please try again.');
    },
  });

  const handleEditCategory = (item: any) => {
    if (isContentOnly) {
      setContentDraft(item.content ?? '');
      setIsEditingContent(true);
      return;
    }
    setFormMode('edit');
    setEditingCategory(item);
    setIsCategoryFormOpen(true);
  };

  const handleCancelContentEdit = () => {
    setIsEditingContent(false);
    setContentDraft('');
  };

  const handleSaveContent = () => {
    if (!subCategory) return;
    updateSubCategoryMutation.mutate({
      id: subCategory.id,
      data: {
        main_category_id: mainId,
        name_english: subCategory.name_english,
        name_tibetan: subCategory.name_tibetan,
        description_english: subCategory.description_english,
        description_tibetan: subCategory.description_tibetan,
        order_index: subCategory.order_index,
        is_active: subCategory.is_active,
        only_content: true,
        content: contentDraft,
      },
    });
  };

  const savedContent = subCategory?.content ?? '';
  const isContentDirty = isEditingContent && contentDraft !== savedContent;

  const handleCreateText = () => {
    if (!subId) return;
    setEditingText(newTextDraft(subId));
    setIsTextEditModalOpen(true);
  };

  const handleEditText = (item: any) => {
    setEditingText(item);
    setIsTextEditModalOpen(true);
  };

  const handleDeleteText = async (item: any) => {
    const confirmMessage = `Are you sure you want to delete the text "${item.english_title || item.tibetan_title || 'Untitled'}"?`;
    if (!globalThis.confirm(confirmMessage)) {
      return;
    }
    deleteTextMutation.mutate(item.id);
  };

  const handleSaveCategory = async (updatedData: any) => {
    updateSubCategoryMutation.mutate({
      id: subCategory!.id,
      data: {
        main_category_id: mainId,
        name_english: updatedData.name_english,
        name_tibetan: updatedData.name_tibetan,
        description_english: updatedData.description_english,
        description_tibetan: updatedData.description_tibetan,
        order_index: updatedData.order_index,
        is_active: updatedData.is_active,
        only_content: updatedData.only_content || false,
        content: updatedData.only_content ? updatedData.content : null,
      },
    });
  };

  const filteredTexts = texts.filter((text: any) =>
    !searchQuery ||
    text.english_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    text.tibetan_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    text.sanskrit_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (!subCategory || !mainCategory) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('categoryNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { 
            label: isTibetan 
              ? (mainCategory.name_tibetan || mainCategory.name_english) 
              : (mainCategory.name_english || mainCategory.name_tibetan || ''), 
            href: `/admin/karchag/${mainId}` 
          },
          { 
            label: isTibetan 
              ? (subCategory.name_tibetan || subCategory.name_english) 
              : (subCategory.name_english || subCategory.name_tibetan || ''), 
            href: `/admin/karchag/${mainId}/${subId}` 
          }
        ]}
        homeHref="/admin/karchag"
        homeLabel={t('allCategories')}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 py-[10px] tibetan text-left">{subCategory.name_tibetan}</h1>
          <p className="text-sm font-medium text-kangyur-maroon english mt-1">{subCategory.name_english}</p>
        </div>
        <div className="flex items-center gap-2  "
        style={{fontFamily: isTibetan ? 'CustomTibetan' : ''}}
        >
          {isContentOnly && isEditingContent ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelContentEdit}>
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveContent}
                disabled={!isContentDirty || updateSubCategoryMutation.isPending}
              >
                {t('saveChanges')}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleEditCategory(subCategory)}>
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden md:block">{t('editSubcategory')}</span>
            </Button>
          )}
          {!isContentOnly && (
            <Button onClick={handleCreateText}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden md:block">{t('createNewText')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {!isContentOnly && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('searchTexts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isContentOnly ? (
        // Content-only subcategory: show a single passage instead of a text list
        <Card className="p-6 bg-gray-50">
          {isEditingContent ? (
            <FootnoteableTextarea
              id="sub-category-content"
              label={t('content')}
              value={contentDraft}
              onChange={setContentDraft}
              rows={16}
              className={`min-h-[320px] whitespace-pre-wrap ${isTibetan ? 'tibetan' : ''}`}
              textId={subCategory.id}
              fieldKey="content"
            />
          ) : (
            <FootnoteText
              text={subCategory.content || ''}
              footnotes={contentFootnotes}
              className="text-gray-700 whitespace-pre-wrap tibetan"
              onReposition={(id, start, end) => repositionFootnote(subCategory.id, 'content', id, start, end)}
            />
          )}
        </Card>
      ) : (
        // For Discourses: Show texts
        <div className="space-y-4 ">
          {filteredTexts.map((text: any) => (
            <TextCard
              key={text.id}
              text={text}
              mainCategories={mainCategories}
              subCategories={subCategories}
              onEdit={handleEditText}
              onDelete={handleDeleteText}
            />
          ))}
          {filteredTexts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('noTextsFound')}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Form */}
      <CategoryForm
        isOpen={isCategoryFormOpen}
        onClose={() => setIsCategoryFormOpen(false)}
        mode={formMode}
        data={editingCategory}
        mainCategories={mainCategories}
        defaultMainCategoryId={mainId || null}
        onSave={handleSaveCategory}
      />

      {/* Create / edit text: same modal as edit (metadata + translation / summary tabs) */}
     
      {isTextEditModalOpen && editingText && subId && (
        <TextEditModal
          isOpen={isTextEditModalOpen}
          onClose={() => {
            setIsTextEditModalOpen(false);
            setEditingText(null);
          }}
          text={editingText}
          subCategories={subCategories}
          mainCategories={mainCategories}
          hideSubCategorySelect
          onCreateText={
            editingText.id
              ? undefined
              : async (fd) =>
                  api.createKarchagText(toKarchagTextApiPayload(fd, subId))
          }
          onTextCreated={(created) => {
            queryClient.invalidateQueries({ queryKey: ['karchag', 'texts'] });
            setEditingText(created);
          }}
          onSave={(data) => {
            if (!editingText?.id) return;
            updateTextMutation.mutate({
              id: editingText.id,
              data: {
                sub_category_id: data.sub_category_id || subId,
                derge_id: data.derge_id,
                yeshe_de_id: data.yeshe_de_id,
                tibetan_title: data.tibetan_title,
                chinese_title: data.chinese_title,
                sanskrit_title: data.sanskrit_title,
                english_title: data.english_title,
                alternative_title: data.alternative_title,
                chapter_number: data.chapter_number,
                bampo_number: data.bampo_number,
                page_count: data.page_count,
                interpretation: data.interpretation,
                pitaka_type: data.pitaka_type,
                pedurma_volume_number: data.pedurma_volume_number,
                sermon: data.sermon,
                yana: data.yana,
                translation_period: data.translation_period,
                yeshe_de_volume_number: data.yeshe_de_volume_number,
                yeshe_de_volume_length: data.yeshe_de_volume_length,
                pecing_link: data.pecing_link,
                narthang_link: data.narthang_link,
                pdf_url: data.pdf_url,
                order_index: data.order_index,
                is_active: data.is_active,
              },
            });
            setIsTextEditModalOpen(false);
            setEditingText(null);
          }}
          onSummarySave={() => {
            queryClient.invalidateQueries({ queryKey: ['karchag', 'texts'] });
          }}
        />
      )}
    </div>
  );
};
