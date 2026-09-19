import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/atoms/button";
import { RichTextEditor } from "@/components/ui/molecules/RichTextEditor";
import { Label } from "@/components/ui/atoms/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/atoms/dialog";
import api from '@/utils/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useLanguage from '@/hooks/useLanguage';

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

// Define all sections (always show all in admin form)
const allSections = [
  'translation-homage',
  'purpose',
  'summary',
  'word-meaning',
  'connection',
  'questions-answers',
  'colophon',
] as const;

interface TextSummaryFormProps {
  isOpen: boolean;
  onClose: () => void;
  textId: string;
  textTitle?: string;
  onSave?: () => void;
}

export const TextSummaryForm = ({ isOpen, onClose, textId, textTitle, onSave }: TextSummaryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('translation-homage');
  const { isTibetan, t } = useLanguage();
  const [formData, setFormData] = useState({
    translation_homage_tibetan: '',
    translation_homage_english: '',
    purpose_tibetan: '',
    purpose_english: '',
    summary_text_tibetan: '',
    summary_text_english: '',
    word_meaning_tibetan: '',
    word_meaning_english: '',
    connection_tibetan: '',
    connection_english: '',
    question_answers_tibetan: '',
    question_answers_english: '',
    colophon_tibetan: '',
    colophon_english: '',
  });

  useEffect(() => {
    if (isOpen && textId) {
      fetchSummary();
      setActiveSection('translation-homage');
    }
  }, [isOpen, textId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const summary = await api.getKarchagTextSummary(textId);
      if (summary) {
        setFormData({
          translation_homage_tibetan: summary.translation_homage_tibetan || '',
          translation_homage_english: summary.translation_homage_english || '',
          purpose_tibetan: summary.purpose_tibetan || '',
          purpose_english: summary.purpose_english || '',
          summary_text_tibetan: summary.summary_text_tibetan || '',
          summary_text_english: summary.summary_text_english || '',
          word_meaning_tibetan: summary.word_meaning_tibetan || '',
          word_meaning_english: summary.word_meaning_english || '',
          connection_tibetan: summary.connection_tibetan || '',
          connection_english: summary.connection_english || '',
          question_answers_tibetan: summary.question_answers_tibetan || '',
          question_answers_english: summary.question_answers_english || '',
          colophon_tibetan: summary.colophon_tibetan || '',
          colophon_english: summary.colophon_english || '',
        });
      } else {
        // Reset form if no summary exists
        setFormData({
          translation_homage_tibetan: '',
          translation_homage_english: '',
          purpose_tibetan: '',
          purpose_english: '',
          summary_text_tibetan: '',
          summary_text_english: '',
          word_meaning_tibetan: '',
          word_meaning_english: '',
          connection_tibetan: '',
          connection_english: '',
          question_answers_tibetan: '',
          question_answers_english: '',
          colophon_tibetan: '',
          colophon_english: '',
        });
      }
    } catch (error: any) {
      // If summary doesn't exist, that's okay - we'll create it
      if (error.status !== 404) {
        console.error('Failed to fetch summary:', error);
        toast.error('Failed to load summary');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await api.createOrUpdateKarchagTextSummary(textId, formData);
      if (onSave) {
        onSave();
        onClose();

      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save summary:', error);
      toast.error(error?.message || 'Failed to save summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      setLoading(true);
      await api.deleteKarchagTextSummary(textId);
      toast.success('Summary deleted successfully');
      setFormData({
        translation_homage_tibetan: '',
        translation_homage_english: '',
        purpose_tibetan: '',
        purpose_english: '',
        summary_text_tibetan: '',
        summary_text_english: '',
        word_meaning_tibetan: '',
        word_meaning_english: '',
        connection_tibetan: '',
        connection_english: '',
        question_answers_tibetan: '',
        question_answers_english: '',
        colophon_tibetan: '',
        colophon_english: '',
      });
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to delete summary:', error);
      toast.error(error?.message || 'Failed to delete summary');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      translation_homage_tibetan: '',
      translation_homage_english: '',
      purpose_tibetan: '',
      purpose_english: '',
      summary_text_tibetan: '',
      summary_text_english: '',
      word_meaning_tibetan: '',
      word_meaning_english: '',
      connection_tibetan: '',
      connection_english: '',
      question_answers_tibetan: '',
      question_answers_english: '',
      colophon_tibetan: '',
      colophon_english: '',
    });
    setActiveSection('translation-homage');
    onClose();
  };

  // Helper function to get form fields for a section
  const getSectionFields = (sectionId: string) => {
    const sectionMap: Record<string, { english: keyof typeof formData; tibetan: keyof typeof formData; rows: number }> = {
      'translation-homage': {
        english: 'translation_homage_english',
        tibetan: 'translation_homage_tibetan',
        rows: 4,
      },
      'purpose': {
        english: 'purpose_english',
        tibetan: 'purpose_tibetan',
        rows: 4,
      },
      'summary': {
        english: 'summary_text_english',
        tibetan: 'summary_text_tibetan',
        rows: 6,
      },
      'word-meaning': {
        english: 'word_meaning_english',
        tibetan: 'word_meaning_tibetan',
        rows: 4,
      },
      'connection': {
        english: 'connection_english',
        tibetan: 'connection_tibetan',
        rows: 4,
      },
      'questions-answers': {
        english: 'question_answers_english',
        tibetan: 'question_answers_tibetan',
        rows: 4,
      },
      'colophon': {
        english: 'colophon_english',
        tibetan: 'colophon_tibetan',
        rows: 4,
      },
    };
    return sectionMap[sectionId];
  };

  if (!isOpen) return null;

  const currentSectionFields = getSectionFields(activeSection);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[70dvh] p-0 overflow-scroll flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {textTitle ? `Text: ${textTitle}` : t('summary')}
          </DialogTitle>
        </DialogHeader>
        {loading && !formData.translation_homage_english ? (
          <div className="flex justify-center items-center py-12 px-6">
            <p className="text-gray-500">{t('loadingSummary')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Navigation Bar */}
              <div className="md:w-1/4 lg:w-1/5 border-b md:border-b-0 md:border-r border-border bg-muted/30 max-h-56 md:max-h-none md:h-full overflow-y-auto">
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">
                    {t('summarySections')}
                  </h3>
                  <nav className="space-y-2">
                    {allSections.map((sectionId) => (
                      <button
                        key={sectionId}
                        type="button"
                        onClick={() => setActiveSection(sectionId)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold capitalize",
                          isTibetan && "tibetan",
                          activeSection === sectionId
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t(sectionTitleMap[sectionId])}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Right Form Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {currentSectionFields && (
                    <div className="space-y-4">
                      <h3
                        className={cn(
                          "text-lg sm:text-xl font-semibold text-kangyur-maroon mb-3 sm:mb-4 capitalize",
                          isTibetan && "tibetan"
                        )}
                      >
                        {t(sectionTitleMap[activeSection as keyof typeof sectionTitleMap] || activeSection)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${currentSectionFields.english}`}>
                            {t('englishContent')}
                          </Label>
                          <RichTextEditor
                            id={currentSectionFields.english}
                            value={formData[currentSectionFields.english] ?? ''}
                            onChange={(html) => setFormData({ ...formData, [currentSectionFields.english]: html })}
                            rows={currentSectionFields.rows}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${currentSectionFields.tibetan}`}>
                            {t('tibetanContent')}
                          </Label>
                          <RichTextEditor
                            id={currentSectionFields.tibetan}
                            value={formData[currentSectionFields.tibetan] ?? ''}
                            onChange={(html) => setFormData({ ...formData, [currentSectionFields.tibetan]: html })}
                            rows={currentSectionFields.rows}
                            tibetan
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                {t('cancel')}
              </Button>
              {/* <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={loading}
              >
                {t('delete')} {t('summary')}
              </Button> */}
              <Button type="submit" disabled={loading}>
                {loading ? t('uploading') : t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
