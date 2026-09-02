import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Label } from "@/components/ui/atoms/label";
import { Textarea } from "@/components/ui/atoms/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/atoms/radio-group";
import { Switch } from "@/components/ui/atoms/switch";
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
import { FootnoteableTextarea } from '@/components/admin/texts/FootnoteableTextarea';

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

  const buildCreateFormData = (mainCategoryId: string | null) => ({
    name_english: '',
    name_tibetan: '',
    description_english: '',
    description_tibetan: '',
    order_index: 0,
    is_active: true,
    category_type: mainCategoryId ? 'sub' : 'main',
    main_category_id: mainCategoryId,
    only_content: false,
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
      only_content: !!source.only_content,
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

  const showDisplayOrder = formData.category_type === 'sub' && formData.only_content;
  const subCategoryId = mode === 'edit' ? data?.id : undefined;

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
                  setFormData({
                    ...formData,
                    main_category_id: value,
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
              <Textarea
                id="description_tibetan"
                value={formData.description_tibetan}
                onChange={(e) => setFormData({ ...formData, description_tibetan: e.target.value })}
                className="font-tibetan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_english">{t('englishDescription')} </Label>
              <Textarea
                id="description_english"
                value={formData.description_english}
                onChange={(e) => setFormData({ ...formData, description_english: e.target.value })}
              />
            </div>
           
          </div>

          {/* Content-only toggle: a content-only subcategory shows a single passage instead of a text list */}
          {formData.category_type === 'sub' && (
            <div className="flex items-center gap-3">
              <Switch
                id="only_content"
                checked={formData.only_content}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, only_content: checked, content: checked ? formData.content : '' })
                }
              />
              <Label htmlFor="only_content">{t('contentOnlySubcategory')}</Label>
            </div>
          )}

          {/* Display order for content-only subcategories */}
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

          {/* Content field (only for content-only sub categories) */}
          {formData.category_type === 'sub' && formData.only_content && (
            <FootnoteableTextarea
              id="content"
              label={t('content')}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              rows={10}
              className={isTibetan ? 'tibetan' : undefined}
              textId={subCategoryId}
              fieldKey="content"
            />
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
