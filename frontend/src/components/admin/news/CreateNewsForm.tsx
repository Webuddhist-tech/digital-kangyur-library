import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { RichTextEditor } from "@/components/ui/molecules/RichTextEditor";
import { Switch } from "@/components/ui/atoms/switch";
import { Label } from "@/components/ui/atoms/label";
import { Plus, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/atoms/dialog";
import { format } from 'date-fns';
import api from '@/utils/api';
import { toast } from 'sonner';
import { isRichTextEmpty } from '@/utils/richText';
import { useLanguage } from '@/hooks/useLanguage';

interface NewsFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  data?: {
    id?: number;
    tibetan_title: string;
    english_title: string;
    tibetan_content: string;
    english_content: string;
    published_date: string;
    thumbnail_url?: string;
    is_active: boolean;
  };
  onSave: (data: any) => void;
}

export const NewsForm = ({ isOpen, onClose, mode, data, onSave }: NewsFormProps) => {
  const { t ,isTibetan} = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(data || {
    tibetan_title: '',
    english_title: '',
    tibetan_content: '',
    english_content: '',
    published_date: format(new Date(), 'yyyy-MM-dd'),
    thumbnail_url: '',
    is_active: true
  });

  // Update formData when data changes or when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (data && mode === 'edit') {
        setFormData({
          tibetan_title: data.tibetan_title || '',
          english_title: data.english_title || '',
          tibetan_content: data.tibetan_content || '',
          english_content: data.english_content || '',
          published_date: data.published_date || format(new Date(), 'yyyy-MM-dd'),
          thumbnail_url: data.thumbnail_url || '',
          is_active: data.is_active ?? true
        });
      } else {
        // Always set today's date when creating new news
        setFormData({
          tibetan_title: '',
          english_title: '',
          tibetan_content: '',
          english_content: '',
          published_date: format(new Date(), 'yyyy-MM-dd'),
          thumbnail_url: '',
          is_active: true
        });
      }
    }
  }, [isOpen, data, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The rich text editor is not a form control, so the `required` the old
    // textareas carried has to be enforced here.
    if (isRichTextEmpty(formData.english_content) || isRichTextEmpty(formData.tibetan_content)) {
      toast.error(t('pleaseFillAllRequiredFields'));
      return;
    }
    onSave(formData);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (images only)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error(t('pleaseSelectValidImage'));
      return;
    }

    // Validate file size (10MB limit for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(t('imageSizeMustBeLessThan10MB'));
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadFile(file);
      setFormData({ ...formData, thumbnail_url: result.url });
      toast.success(t('thumbnailUploadedSuccessfully'));
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || t('failedToUploadThumbnail'));
    } finally {
      setUploading(false);
    }
  };

  const handleResetThumbnailUrl = () => {
    setFormData({ ...formData, thumbnail_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const thumbnail_name = formData.thumbnail_url
  ? (() => {
      const filename = formData.thumbnail_url.split('/').pop() || '';
      const parts = filename.split('_');
      return parts.length > 1 ? parts.slice(1).join('_') : filename;
    })()
  : '';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('createNewsArticle') : t('editNewsArticle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6" style={{fontFamily: isTibetan ? 'CustomTibetan' : ''}}>
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="english_title">{t('englishTitle')}</Label>
              <Input
                id="english_title"
                value={formData.english_title}
                onChange={(e) => setFormData({ ...formData, english_title: e.target.value })}
                required
                placeholder={t('enterEnglishTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tibetan_title">{t('tibetanTitle')}</Label>
              <Input
                id="tibetan_title"
                value={formData.tibetan_title}
                onChange={(e) => setFormData({ ...formData, tibetan_title: e.target.value })}
                className="font-tibetan"
                required
                placeholder={t('enterTibetanTitle')}
              />
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="english_content">{t('englishContent')}</Label>
              <RichTextEditor
                id="english_content"
                value={formData.english_content}
                onChange={(html) => setFormData({ ...formData, english_content: html })}
                rows={8}
                placeholder={t('enterEnglishContent')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tibetan_content">{t('tibetanContent')}</Label>
              <RichTextEditor
                id="tibetan_content"
                value={formData.tibetan_content}
                onChange={(html) => setFormData({ ...formData, tibetan_content: html })}
                rows={8}
                tibetan
                placeholder={t('enterTibetanContent')}
              />
            </div>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">{t('thumbnail')}</Label>
            <div className={`${!formData.thumbnail_url ? 'flex' : 'hidden'} gap-2`}>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url || ''}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder={t('enterThumbnailUrl')}
                type="url"
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                id="thumbnail_file_upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? t('uploading') : t('upload')}
              </Button>
            </div>
            {formData.thumbnail_url && (
              <div className="mt-2 space-y-1">
                <div className='flex items-center gap-2'>

                <p className="text-xs text-muted-foreground">
                  {t('thumbnailUrl')}: <a href={formData.thumbnail_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{thumbnail_name}</a>
                </p>
                <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetThumbnailUrl}
                      className="h-6 w-6 p-0"
                      title={t('resetThumbnailUrl')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                  <img 
                    src={formData.thumbnail_url} 
                    alt={t('thumbnailPreview')} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Published Date and Active Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="published_date">{t('publishedDate')}</Label>
              <Input
                id="published_date"
                type="date"
                value={formData.published_date}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                required
              />
            </div>
       
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit">
              {mode === 'create' ? t('createNews') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateNewsForm = () => {
  const { t ,isTibetan} = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (data: any) => {
    // Here you would typically make an API call to save the data
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} style={{fontFamily: isTibetan ? 'CustomTibetan' : ''}}>
        <Plus className="mr-2 h-4 w-4" />
        {t('createNews')}
      </Button>

      <NewsForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode="create"
        onSave={handleSave}
      />
    </>
  );
};
