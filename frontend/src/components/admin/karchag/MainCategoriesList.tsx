import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Card } from '@/components/ui/atoms/card';
import { Edit, Trash2, Search, Plus, FolderTree, ChevronRight } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { CategoryForm } from './CategoryForm';
import { useLanguage } from '@/hooks/useLanguage';
import { richTextToPlain } from '@/utils/richText';

interface MainCategoriesListProps {
  onEditCategory?: (category: any) => void;
  onDeleteCategory?: (category: any) => void;
}

export const MainCategoriesList: React.FC<MainCategoriesListProps> = ({
  onEditCategory,
  onDeleteCategory,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t ,isTibetan} = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const { data: mainCategoriesData, isLoading } = useQuery({
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

  const mainCategories = mainCategoriesData || [];
  const subCategories = subCategoriesData || [];

  const createMainCategoryMutation = useMutation({
    mutationFn: (data: any) => api.createKarchagMainCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'main-categories'] });
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success('Main category created successfully');
    },
    onError: (error) => {
      console.error('Error creating main category:', error);
      toast.error('Error creating category. Please try again.');
    },
  });

  const updateMainCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateKarchagMainCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'main-categories'] });
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success('Main category updated successfully');
    },
    onError: (error) => {
      console.error('Error updating main category:', error);
      toast.error('Error updating category. Please try again.');
    },
  });

  const deleteMainCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteKarchagMainCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karchag', 'main-categories'] });
      queryClient.invalidateQueries({ queryKey: ['karchag', 'sub-categories'] });
      toast.success('Main category deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting main category:', error);
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
    const confirmMessage = `Are you sure you want to delete the main category "${item.name_english}"? This will also delete all its subcategories and texts.`;
    if (!globalThis.confirm(confirmMessage)) {
      return;
    }
    deleteMainCategoryMutation.mutate(item.id);
  };

  const handleSave = async (updatedData: any) => {
    if (formMode === 'create') {
      createMainCategoryMutation.mutate({
        name_english: updatedData.name_english,
        name_tibetan: updatedData.name_tibetan,
        description_english: updatedData.description_english,
        description_tibetan: updatedData.description_tibetan,
        order_index: updatedData.order_index,
        is_active: updatedData.is_active,
      });
    } else {
      updateMainCategoryMutation.mutate({
        id: editingItem.id,
        data: {
          name_english: updatedData.name_english,
          name_tibetan: updatedData.name_tibetan,
          description_english: updatedData.description_english,
          description_tibetan: updatedData.description_tibetan,
          order_index: updatedData.order_index,
          is_active: updatedData.is_active,
        },
      });
    }
  };

  const filteredMainCategories = mainCategories.filter(category =>
    category.name_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.name_tibetan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{fontFamily: isTibetan ? 'CustomTibetan' : ''}}>
      {/* Header with Search and Create Button */}
      <div className="flex items-center flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <h1 className={`text-3xl font-bold text-gray-800 py-[10px] ${isTibetan ? 'tibetan' : 'english'}`}>{t('manageKarchagContent')}</h1>
          <p className={`text-gray-600 mt-1 ${isTibetan ? 'tibetan' : 'english'}`}>{t('createEditManage')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createNewCategory')}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('searchCategories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {filteredMainCategories.map(category => {
          const categorySubCategories = subCategories.filter(sc => sc.main_category_id === category.id);

          return (
            <Card key={category.id} className="flex flex-row items-center hover:shadow-md transition-shadow">
              <div className="flex-1 p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="hidden md:block flex-shrink-0">
                    <FolderTree className="h-8 w-8 text-kangyur-orange" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigate(`/admin/karchag/${category.id}`)}
                        className="flex items-center gap-2 hover:text-kangyur-orange transition-colors"
                      >
                        <h3 className="text-lg font-semibold tibetan text-left">{category.name_tibetan}</h3>
                        {categorySubCategories.length > 0 && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                   
                    
                    </div>
                    <p className="text-sm font-medium text-kangyur-maroon english mt-1">
                    {category.name_english}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{richTextToPlain(category.description_english)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="h-4 w-4" />
                  {t('edit')}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(category)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredMainCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('noCategoriesFound')}</p>
        </div>
      )}

      {/* Category Form */}
      {isFormOpen && (
        <CategoryForm
          key={`${formMode}-${editingItem?.id ?? 'create'}`}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          mode={formMode}
          data={editingItem}
          mainCategories={mainCategories}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
