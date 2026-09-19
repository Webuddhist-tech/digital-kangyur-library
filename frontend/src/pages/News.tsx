
import React, { useState, useEffect } from 'react';
import { StickyFooterShell } from '@/components/ui/molecules/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/atoms/pagination";
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import useLanguage from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import api from '@/utils/api';
import { pickBilingualDisplay, pickBilingualText } from '@/utils/localizedContent';
import { richTextToPlain } from '@/utils/richText';

interface NewsItem {
  id: string;
  title: string;
  titleTibetan?: string;
  tibetanDescription?: string;
  englishDescription?: string;
  date: string;
  imageUrl: string;
  link?: string;
}

const NewsCard = ({ news, isTibetan, t }: { news: NewsItem, isTibetan: boolean, t: any }) => {
  const titleDisp = pickBilingualDisplay(isTibetan, news.titleTibetan, news.title);
  const descText = richTextToPlain(pickBilingualText(isTibetan, news.tibetanDescription, news.englishDescription));
  const descPreview =
    descText.length > 100 ? `${descText.slice(0, 100)}...` : descText || null;

  return (
    <Link 
    to={news.link || '#'} 
  >
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
     
      <div className="overflow-hidden h-48">
        <img 
          src={news.imageUrl} 
          alt={titleDisp.text}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
      <p className={cn('text-xl', titleDisp.scriptIsTibetan ? 'tibetan' : 'english')}>
        {titleDisp.text}
        </p>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">

      <p
        className={cn(
          'text-muted-foreground text-sm mb-3',
          pickBilingualDisplay(isTibetan, news.tibetanDescription, news.englishDescription).scriptIsTibetan && 'tibetan'
        )}
      >
        {descPreview}
        </p>
        <div className="flex items-center text-xs text-kangyur-dark/60">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          {new Date(news.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </CardContent>
      <CardFooter>
        
      </CardFooter>
    </Card>
        </Link>
  );
};

const News = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;
  const { isTibetan, t } = useLanguage();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await api.getNews({
          page: currentPage,
          limit: itemsPerPage,
          sort: 'published_at',
          order: 'desc',
        });

        const transformedNews: NewsItem[] = response.news.map((item: any) => ({
          id: item.id,
          title: item.title?.english || '',
          titleTibetan: item.title?.tibetan,
          englishDescription: item.description?.english || '',
          tibetanDescription: item.description?.tibetan,
          date: item.published_at || item.created_at,
          imageUrl: item.thumbnail_url || '',
          link: `/news/${item.id}`,
        }));

        setNewsItems(transformedNews);
        setTotalPages(response.pagination?.total_pages || 1);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setNewsItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <StickyFooterShell className="bg-kangyur-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
        <div className="mb-10 text-center pt-8">
          <h1 className={cn("text-4xl font-bold text-kangyur-dark mb-3",isTibetan ? 'tibetan' : 'english')}>
            {t('kangyurNews')}
          </h1>
          <p className={cn("text-xl text-kangyur-dark/70 max-w-2xl mx-auto",isTibetan ? 'tibetan' : 'english')}>
             {t('newsSubtitle')}
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-kangyur-dark/60">Loading news...</p>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-kangyur-dark/60">No news available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {newsItems.map((news) => (
              <NewsCard key={news.id} news={news} isTibetan={isTibetan} t={t} />
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={cn(currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer",isTibetan ? 'tibetan' : 'english')}
                >
                  {t('previous')}
                </PaginationPrevious>
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    isActive={currentPage === idx + 1}
                    onClick={() => handlePageChange(idx + 1)}
                    className="cursor-pointer"
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={cn(currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer",isTibetan ? 'tibetan' : 'english')}
                >
                  {t('next')}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </StickyFooterShell>
  );
};

export default News;
