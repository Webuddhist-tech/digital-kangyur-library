import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Card } from '@/components/ui/atoms/card';
import { Search, Plus, ChevronRight, FolderTree, Edit, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import Breadcrumb from '@/components/ui/atoms/Breadcrumb';
import { CategoryForm } from './CategoryForm';
import { useLanguage } from '@/hooks/useLanguage';

export const MainCategoryView: React.FC = () => {
  const { mainId } = useParams<{ mainId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, currentLanguage, isTibetan } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const { data: mainCategoryData, isLoading: isLoadingMain } = useQuery({
    queryKey: ['karchag', 'main-category', mainId],
    queryFn: async () => {
      if (!mainId) throw new Error('Main ID is required');
      const res = await api.getKarchagMainCategoryById(mainId);
      return res;
    },
    enabled: !!mainId,
  });

  const { data: subCategoriesData, isLoading: isLoadingSub } = useQuery({
    queryKey: ['karchag', 'sub-categories', mainId],
    queryFn: async () => {
      const res = await api.getKarchagSubCategories({ main_category_id: mainId });
      return res.categories || [];
    },
    enabled: !!mainId,
  });


  const { data: mainCategoriesData } = useQuery({
    queryKey: ['karchag', 'main-categories'],
    queryFn: async () => {
      const res = await api.getKarchagMainCategories();
      return res.categories || [];
    },
  });

  const mainCategory = mainCategoryData;
  const subCategories = subCategoriesData || [];
  const mainCategories = mainCategoriesData || [];
  const isLoading = isLoadingMain || isLoadingSub;

  const createSubCategoryMutation = useMutation({
    mutationFn: (data: any) => api.createKarchagSubCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'sub-categories'] });
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success('Subcategory created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating sub category:', error);
      toast.error('Error creating category. Please try again.');
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateKarchagSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'sub-categories'] });
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success('Subcategory updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating sub category:', error);
      toast.error('Error updating category. Please try again.');
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteKarchagSubCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'sub-categories'] });
      queryClient.invalidateQueries({ queryKey: ['karchag', 'texts'] });
      toast.success('Subcategory deleted successfully');
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error?.message || 'Error deleting category. Please try again.');
    },
  });

  const handleCreate = () => {
    setFormMode('create');
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormMode('edit');
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: any) => {
    const confirmMessage = `Are you sure you want to delete the subcategory "${item.name_english}"? This will also delete all texts in this subcategory.`;
    if (!globalThis.confirm(confirmMessage)) {
      return;
    }
    deleteSubCategoryMutation.mutate(item.id);
  };

  const handleSave = async (updatedData: any) => {
    if (formMode === 'create') {
      createSubCategoryMutation.mutate({
        main_category_id: mainId,
        name_english: updatedData.name_english,
        name_tibetan: updatedData.name_tibetan,
        description_english: updatedData.description_english,
        description_tibetan: updatedData.description_tibetan,
        order_index: updatedData.order_index,
        is_active: updatedData.is_active,
        only_content: updatedData.only_content || false,
        content: updatedData.only_content ? updatedData.content : null,
      });
    } else {
      updateSubCategoryMutation.mutate({
        id: editingItem.id,
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
    }
  };

  const filteredSubCategories = subCategories
    .filter(sc =>
      sc.name_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.name_tibetan?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (!mainCategory) {
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
        items={[{ 
          label: isTibetan 
            ? (mainCategory.name_tibetan || mainCategory.name_english) 
            : (mainCategory.name_english || mainCategory.name_tibetan || ''), 
          href: `/admin/karchag/${mainId}` 
        }]}
        homeHref="/admin/karchag"
        homeLabel={t('allCategories')}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 py-[10px] tibetan ">{currentLanguage === 'en' ? mainCategory.name_english : mainCategory.name_tibetan}</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createNewSubcategory')}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('searchSubcategories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content - Show subcategories list matching MainCategoriesList UI */}
      <div className="space-y-4">
        {filteredSubCategories.map(subCat => (
          <Card key={subCat.id} className="flex flex-row items-center hover:shadow-md transition-shadow">
            <div className="flex-1 px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="hidden md:block flex-shrink-0">
                  <FolderTree className="h-8 w-8 text-kangyur-orange" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigate(`/admin/karchag/${mainId}/${subCat.id}`)}
                      className="flex items-center gap-2 hover:text-kangyur-orange transition-colors"
                    >
                      <h3 className="text-lg font-semibold tibetan text-left"> {subCat.name_tibetan}</h3>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-kangyur-maroon tibetan mt-1">
                  {subCat.name_english}
                  </p>
               
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(subCat)}>
                    <Edit className="h-4 w-4" />
                    {t('edit')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(subCat)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSubCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('noSubcategoriesFound')}</p>
        </div>
      )}

      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        data={editingItem}
        mainCategories={mainCategories}
        defaultMainCategoryId={mainId || null}
        onSave={handleSave}
      />
    </div>
  );
};
