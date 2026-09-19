import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StickyFooterShell } from '@/components/ui/molecules/Footer';
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import useLanguage from '@/hooks/useLanguage';
import api from '@/utils/api';
import { cn } from '@/lib/utils';
import { pickBilingualDisplay, pickBilingualText } from '@/utils/localizedContent';
import { RichTextContent } from '@/components/ui/molecules/RichTextContent';

interface NewsArticle {
  id: string;
  title: {
    tibetan?: string;
    english: string;
  };
  description: {
    tibetan?: string;
    english: string;
  };
  thumbnail_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isTibetan, t } = useLanguage();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) {
        setError('No article ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.getNewsById(id);
        setArticle(response);
      } catch (err: any) {
        console.error('Failed to fetch news article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id]);

  if (loading) {
    return (
      <StickyFooterShell className="bg-kangyur-light">
        <div className="container mx-auto flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-center px-4 pt-24 text-center">
            <p className="text-kangyur-dark/60">Loading article...</p>
          </div>
        </div>
      </StickyFooterShell>
    );
  }

  if (error || !article) {
    return (
      <StickyFooterShell className="bg-kangyur-light">
        <div className="container mx-auto flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-col items-center justify-center px-4 pt-24 text-center">
            <h1 className={cn('text-4xl font-bold text-kangyur-dark mb-4', isTibetan ? 'tibetan' : 'english')}>
              {t('articleNotFound') || 'Article Not Found'}
            </h1>
            <p className={cn('text-kangyur-dark/70 mb-6', isTibetan ? 'tibetan' : 'english')}>
              {error || 'The requested news article could not be found.'}
            </p>
            <Link to="/news">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToNews') || 'Back to News'}
              </Button>
            </Link>
          </div>
        </div>
      </StickyFooterShell>
    );
  }

  const titleDisp = pickBilingualDisplay(isTibetan, article.title?.tibetan, article.title?.english);
  const bodyDisp = pickBilingualDisplay(
    isTibetan,
    article.description?.tibetan,
    article.description?.english
  );
  const bodyText = pickBilingualText(isTibetan, article.description?.tibetan, article.description?.english);

  return (
    <StickyFooterShell className="bg-kangyur-light">
      <div className="container mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 pt-8">
          <Link to="/news">
            <Button variant="outline" className="mb-4 mt-[15px]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToNews','Back to News')}
            </Button>
          </Link>
        </div>

        <Card className="max-w-4xl mx-auto">
          {article.thumbnail_url && (
            <div className="overflow-hidden h-64 md:h-80">
              <img 
                src={article.thumbnail_url} 
                alt={titleDisp.text}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardContent className="p-8">
            <div className="mb-6">
              <h1
                className={cn(
                  'text-3xl md:text-4xl font-bold text-kangyur-dark mb-2',
                  titleDisp.scriptIsTibetan ? 'tibetan' : 'english'
                )}
              >
                {titleDisp.text}
              </h1>
              
              <div className={cn("flex items-center text-kangyur-dark/60 mt-4", isTibetan ? 'tibetan' : 'english')}>
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <RichTextContent
              value={bodyText}
              tibetan={bodyDisp.scriptIsTibetan}
              className={cn(
                'text-kangyur-dark leading-relaxed',
                !bodyDisp.scriptIsTibetan && 'english'
              )}
            />
          </CardContent>
        </Card>
      </div>
    </StickyFooterShell>
  );
};

export default NewsDetail;