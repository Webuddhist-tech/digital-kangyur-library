import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Label } from "@/components/ui/atoms/label";
import { RichTextEditor } from "@/components/ui/molecules/RichTextEditor";
import { RadioGroup, RadioGroupItem } from "@/components/ui/atoms/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/atoms/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/atoms/select";
import { useLanguage } from '@/hooks/useLanguage';
import { isContentOnlyCategory } from '@/utils/karchagCategory';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  data?: any;
  mainCategories: any[];
  defaultMainCategoryId?: string | null;
  onSave: (data: any) => void;
}

export const CategoryForm = ({ isOpen, onClose, mode, data, mainCategories, defaultMainCategoryId, onSave }: CategoryFormProps) => {
  const { t ,isTibetan} = useLanguage();
  
  const isContentOnlyMainCategory = (mainCategoryId: string | null): boolean => {
    if (!mainCategoryId) return false;
    const mainCategory = mainCategories.find(mc => mc.id === mainCategoryId);
    return isContentOnlyCategory(mainCategory?.name_english);
  };

  const buildCreateFormData = (mainCategoryId: string | null) => ({
    name_english: '',
    name_tibetan: '',
    description_english: '',
    description_tibetan: '',
    order_index: 0,
    is_active: true,
    category_type: mainCategoryId ? 'sub' : 'main',
    main_category_id: mainCategoryId,
    only_content: isContentOnlyMainCategory(mainCategoryId),
    content: '',
  });

  const buildEditFormData = (source: any) => {
    const mainCatId = source.main_category_id || null;
    return {
      name_english: source.name_english || '',
      name_tibetan: source.name_tibetan || '',
      description_english: source.description_english || '',
      description_tibetan: source.description_tibetan || '',
      order_index: source.order_index || 0,
      is_active: source.is_active !== undefined ? source.is_active : true,
      category_type: source.main_category_id ? 'sub' : 'main',
      main_category_id: mainCatId,
      only_content: isContentOnlyMainCategory(mainCatId),
      content: source.content || '',
    };
  };

  const [formData, setFormData] = useState(() =>
    data && mode === 'edit'
      ? buildEditFormData(data)
      : buildCreateFormData(defaultMainCategoryId || null)
  );

  // Reset on open so consecutive creates do not keep the last submission.
  useEffect(() => {
    if (!isOpen) return;
    if (data && mode === 'edit') {
      setFormData(buildEditFormData(data));
    } else {
      setFormData(buildCreateFormData(defaultMainCategoryId || null));
    }
  }, [isOpen, data, defaultMainCategoryId, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const showDisplayOrder =
    formData.category_type === 'sub' && isContentOnlyMainCategory(formData.main_category_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll" style={{fontFamily: isTibetan ? 'CustomTibetan' : ''}}>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('createNewCategory') : t('editCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Type Selection - only show if no defaultMainCategoryId */}
          {!defaultMainCategoryId && (
            <div className="space-y-4">
              <Label>{t('categoryType')}</Label>
              <RadioGroup
                value={formData.category_type}
                onValueChange={(value) => setFormData({ ...formData, category_type: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="main" id="main" />
                  <Label htmlFor="main">{t('mainCategory')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sub" id="sub" />
                  <Label htmlFor="sub">{t('subCategory')}</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {formData.category_type === 'sub' && (
            <div className="space-y-2">
              <Label htmlFor="main_category_id">{t('mainCategory')} <span className="text-red-600">*</span> </Label>
              <Select
                value={formData.main_category_id?.toString() || ''}
                onValueChange={(value) => {
                  const isContentOnly = isContentOnlyMainCategory(value);
                  setFormData({ 
                    ...formData, 
                    main_category_id: value,
                    only_content: isContentOnly
                  });
                }}
                required
                disabled={!!defaultMainCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMainCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                     {category.name_tibetan}   {"("+category.name_english+")"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {defaultMainCategoryId && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('creatingSubcategoryUnder')} {mainCategories.find(mc => mc.id === defaultMainCategoryId)?.name_english}
                </p>
              )}
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label htmlFor="name_tibetan">{t('tibetanName')} <span className="text-red-600">*</span> </Label>
              <Input
                id="name_tibetan"
                value={formData.name_tibetan}
                onChange={(e) => setFormData({ ...formData, name_tibetan: e.target.value })}
                className="font-tibetan"
                required

              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_english">{t('englishName')} </Label>
              <Input
                id="name_english"
                value={formData.name_english}
                onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
              />
            </div>
        
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label htmlFor="description_tibetan">{t('tibetanDescription')} </Label>
              <RichTextEditor
                id="description_tibetan"
                value={formData.description_tibetan}
                onChange={(html) => setFormData({ ...formData, description_tibetan: html })}
                rows={4}
                tibetan
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_english">{t('englishDescription')} </Label>
              <RichTextEditor
                id="description_english"
                value={formData.description_english}
                onChange={(html) => setFormData({ ...formData, description_english: html })}
                rows={4}
              />
            </div>
           
          </div>

          {/* Display order for Tantra / Scholarly Work subcategories */}
          {showDisplayOrder && (
            <div className="space-y-2">
              <Label htmlFor="order_index">{t('displayOrder')} </Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: Number.parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          )}

          {/* Content Field (only for sub categories, automatically shown for content-only categories) */}
          {formData.category_type === 'sub' && formData.only_content && (
            <div className="space-y-2">
              <Label htmlFor="content">{t('content')}</Label>
              <RichTextEditor
                id="content"
                value={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                rows={10}
                tibetan={isTibetan}
                placeholder="Enter content here..."
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit">
              {mode === 'create' ? t('createCategory') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
