import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { RichTextEditor } from "@/components/ui/molecules/RichTextEditor";
import { Switch } from "@/components/ui/atoms/switch";
import { Label } from "@/components/ui/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/atoms/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/atoms/dialog";
import api from '@/utils/api';
import { toast } from 'sonner';
import { isRichTextEmpty } from '@/utils/richText';

interface TimelineEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  data?: {
    id?: string;
    period_id?: string;
    title_tibetan?: string;
    title_english?: string;
    title_sanskrit?: string;
    description_tibetan?: string;
    description_english?: string;
    category?: string;
    year?: number;
    century?: string;
    era?: string;
    is_approximate?: boolean;
    location_tibetan?: string;
    location_english?: string;
    significance?: string;
    order_index?: number;
  };
  onSave: (data: any) => Promise<void>;
}

const categoryOptions = [
  { value: 'translation', label: 'Translation' },
  { value: 'compilation', label: 'Compilation' },
  { value: 'publication', label: 'Publication' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'scholarship', label: 'Scholarship' },
];

const significanceOptions = [
  { value: 'major', label: 'Major' },
  { value: 'important', label: 'Important' },
  { value: 'minor', label: 'Minor' },
];

const eraOptions = [
  { value: 'CE', label: 'CE' },
  { value: 'BCE', label: 'BCE' },
];

export const TimelineEventForm = ({ isOpen, onClose, mode, data, onSave }: TimelineEventFormProps) => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [formData, setFormData] = useState({
    period_id: '',
    title_tibetan: '',
    title_english: '',
    title_sanskrit: '',
    description_tibetan: '',
    description_english: '',
    category: '',
    year: '',
    century: '',
    era: 'CE',
    is_approximate: false,
    location_tibetan: '',
    location_english: '',
    significance: '',
    order_index: 0,
  });

  useEffect(() => {
    if (isOpen) {
      // Load periods when dialog opens
      fetchPeriods();
      
      // Initialize form data
      if (mode === 'edit' && data) {
        setFormData({
          period_id: data.period_id || '',
          title_tibetan: data.title?.tibetan || data.title_tibetan || '',
          title_english: data.title?.english || data.title_english || '',
          title_sanskrit: data.title?.sanskrit || data.title_sanskrit || '',
          description_tibetan: data.description?.tibetan || data.description_tibetan || '',
          description_english: data.description?.english || data.description_english || '',
          category: data.category || '',
          year: data.year?.toString() || '',
          century: data.century || '',
          era: data.era || 'CE',
          is_approximate: data.is_approximate || false,
          location_tibetan: data.location?.tibetan || data.location_tibetan || '',
          location_english: data.location?.english || data.location_english || '',
          significance: data.significance || '',
          order_index: data.order_index || 0,
        });
      } else {
        // Reset form for create mode
        setFormData({
          period_id: '',
          title_tibetan: '',
          title_english: '',
          title_sanskrit: '',
          description_tibetan: '',
          description_english: '',
          category: '',
          year: '',
          century: '',
          era: 'CE',
          is_approximate: false,
          location_tibetan: '',
          location_english: '',
          significance: '',
          order_index: 0,
        });
      }
    }
  }, [isOpen, mode, data]);

  const fetchPeriods = async () => {
    try {
      setLoadingPeriods(true);
      const response = await api.getTimelinePeriods({});
      setPeriods(response.periods || []);
    } catch (error) {
      console.error('Failed to fetch periods:', error);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // The rich text editor is not a form control, so the `required` the old
    // description textarea carried has to be enforced here.
    if (isRichTextEmpty(formData.description_english)) {
      toast.error('English description is required');
      return;
    }

    // Prepare data for API
    const submitData: any = {
      title_english: formData.title_english,
      description_english: formData.description_english,
      category: formData.category,
      year: Number.parseInt(formData.year.toString(), 10),
      significance: formData.significance,
    };

    // Add optional fields if they have values
    if (formData.period_id && formData.period_id !== '') {
      submitData.period_id = formData.period_id;
    }
    if (formData.title_tibetan) submitData.title_tibetan = formData.title_tibetan;
    if (formData.title_sanskrit) submitData.title_sanskrit = formData.title_sanskrit;
    if (formData.description_tibetan) submitData.description_tibetan = formData.description_tibetan;
    if (formData.century) submitData.century = formData.century;
    if (formData.era) submitData.era = formData.era;
    if (formData.location_tibetan) submitData.location_tibetan = formData.location_tibetan;
    if (formData.location_english) submitData.location_english = formData.location_english;
    if (formData.order_index) submitData.order_index = formData.order_index;
    
    submitData.is_approximate = formData.is_approximate;

    await onSave(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Timeline Event' : 'Edit Timeline Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label htmlFor="period_id">Period (Optional)</Label>
            <Select
              value={formData.period_id}
              onValueChange={(value) => setFormData({ ...formData, period_id: value })}
              disabled={loadingPeriods}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingPeriods ? "Loading periods..." : "Select a period"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name?.english || period.id_slug} ({period.start_year} - {period.end_year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_english">English Title *</Label>
              <Input
                id="title_english"
                value={formData.title_english}
                onChange={(e) => setFormData({ ...formData, title_english: e.target.value })}
                required
                placeholder="Enter English title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_tibetan">Tibetan Title</Label>
              <Input
                id="title_tibetan"
                value={formData.title_tibetan}
                onChange={(e) => setFormData({ ...formData, title_tibetan: e.target.value })}
                className="font-tibetan"
                placeholder="བོད་ཡིག་གི་འགོ་བརྗོད།"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_sanskrit">Sanskrit Title</Label>
              <Input
                id="title_sanskrit"
                value={formData.title_sanskrit}
                onChange={(e) => setFormData({ ...formData, title_sanskrit: e.target.value })}
                placeholder="Enter Sanskrit title"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_english">English Description *</Label>
              <RichTextEditor
                id="description_english"
                value={formData.description_english}
                onChange={(html) => setFormData({ ...formData, description_english: html })}
                rows={5}
                placeholder="Enter English description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_tibetan">Tibetan Description</Label>
              <RichTextEditor
                id="description_tibetan"
                value={formData.description_tibetan}
                onChange={(html) => setFormData({ ...formData, description_tibetan: html })}
                rows={5}
                tibetan
                placeholder="བོད་ཡིག་གི་ནང་དོན།"
              />
            </div>
          </div>

          {/* Category, Year, Century, Era */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                placeholder="e.g., 800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="century">Century</Label>
              <Input
                id="century"
                value={formData.century}
                onChange={(e) => setFormData({ ...formData, century: e.target.value })}
                placeholder="e.g., 8th"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="era">Era</Label>
              <Select
                value={formData.era}
                onValueChange={(value) => setFormData({ ...formData, era: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eraOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Significance and Approximate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="significance">Significance *</Label>
              <Select
                value={formData.significance}
                onValueChange={(value) => setFormData({ ...formData, significance: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select significance" />
                </SelectTrigger>
                <SelectContent>
                  {significanceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_approximate"
                checked={formData.is_approximate}
                onCheckedChange={(checked) => setFormData({ ...formData, is_approximate: checked })}
              />
              <Label htmlFor="is_approximate">Approximate Date</Label>
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_english">Location (English)</Label>
              <Input
                id="location_english"
                value={formData.location_english}
                onChange={(e) => setFormData({ ...formData, location_english: e.target.value })}
                placeholder="Enter location in English"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_tibetan">Location (Tibetan)</Label>
              <Input
                id="location_tibetan"
                value={formData.location_tibetan}
                onChange={(e) => setFormData({ ...formData, location_tibetan: e.target.value })}
                className="font-tibetan"
                placeholder="བོད་ཡིག་གི་ས་ཆ།"
              />
            </div>
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <Label htmlFor="order_index">Order Index</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: Number.parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Used for sorting events within the same year</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Event' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
