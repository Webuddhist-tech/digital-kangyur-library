import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { RichTextEditor } from "@/components/ui/molecules/RichTextEditor";
import { Switch } from "@/components/ui/atoms/switch";
import { Label } from "@/components/ui/atoms/label";
import { Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/atoms/dialog";
import api from '@/utils/api';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface VideoFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  data?: {
    id?: string;
    tibetan_title: string;
    english_title: string;
    tibetan_description: string;
    english_description: string;
    video_link: string;
    thumbnail_url: string;
    is_active: boolean;
  };
  onSave: (data: any) => void;
}

export const VideoForm = ({ isOpen, onClose, mode, data, onSave }: VideoFormProps) => {
  const { t ,isTibetan} = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    tibetan_title: '',
    english_title: '',
    tibetan_description: '',
    english_description: '',
    video_link: '',
    thumbnail_url: '',
    is_active: true
  });

  useEffect(() => {
    if (isOpen) {
      if (data && mode === 'edit') {
        setFormData({
          tibetan_title: data.tibetan_title || '',
          english_title: data.english_title || '',
          tibetan_description: data.tibetan_description || '',
          english_description: data.english_description || '',
          video_link: data.video_link || '',
          thumbnail_url: data.thumbnail_url || '',
          is_active: data.is_active ?? true
        });
      } else {
        setFormData({
          tibetan_title: '',
          english_title: '',
          tibetan_description: '',
          english_description: '',
          video_link: '',
          thumbnail_url: '',
          is_active: true
        });
      }
    }
  }, [data, isOpen, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <DialogTitle>{mode === 'create' ? t('createVideo') : t('editVideo')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6" style={{fontFamily: isTibetan ? 'CustomTibetan' : ''}}>
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="english_title">{t('englishTitle')} <span className="text-red-500">*</span></Label>
              <Input
                id="english_title"
                value={formData.english_title}
                onChange={(e) => setFormData({ ...formData, english_title: e.target.value })}
                required
                placeholder={t('enterEnglishTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tibetan_title">{t('tibetanTitle')} <span className="text-red-500">*</span></Label>
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

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="english_description">{t('englishDescription')}</Label>
              <RichTextEditor
                id="english_description"
                value={formData.english_description}
                onChange={(html) => setFormData({ ...formData, english_description: html })}
                rows={4}
                placeholder={t('enterEnglishDescription')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tibetan_description">{t('tibetanDescription')}</Label>
              <RichTextEditor
                id="tibetan_description"
                value={formData.tibetan_description}
                onChange={(html) => setFormData({ ...formData, tibetan_description: html })}
                rows={4}
                tibetan
                placeholder={t('enterTibetanDescription')}
              />
            </div>
          </div>

          {/* Video Link */}
          <div className="space-y-2">
            <Label htmlFor="video_link">{t('videoLink')} <span className="text-red-500">*</span></Label>
            <Input
              id="video_link"
              value={formData.video_link}
              onChange={(e) => setFormData({ ...formData, video_link: e.target.value })}
              required
              placeholder={t('enterVideoUrl')}
              type="url"
            />
            <p className="text-xs text-muted-foreground">{t('enterVideoUrlDescription')}</p>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">{t('thumbnail')}</Label>
            <div className={`${formData.thumbnail_url ? 'hidden' : 'flex'} gap-2`}>
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

          {/* Active Status */}
          {/* <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">{t('active')}</Label>
          </div> */}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit">
              {mode === 'create' ? t('createVideo') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
