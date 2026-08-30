import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { NewspaperIcon, FileText, Video, Users } from 'lucide-react';
import useLanguage from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { t, isTibetan } = useLanguage();
  
  const managementCards = [
    {
      titleKey: "karchag",
      icon: FileText,
      path: "/admin/karchag",
      descriptionKey: "manageKangyurTexts"
    },
    {
      titleKey: "videos",
      icon: Video,
      path: "/admin/videos",
      descriptionKey: "manageVideoContent"
    },
   
    {
      titleKey: "news",
      icon: NewspaperIcon,
      path: "/admin/news",
      descriptionKey: "manageNewsArticles"
    },
    {
      titleKey: "users",
      icon: Users,
      path: "/admin/users",
      descriptionKey: "manageSystemUsers"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="text-center py-2">
          <h1 className={cn("text-3xl font-bold text-gray-800 mb-2 pt-5", isTibetan ? 'tibetan' : 'english')}>{t('contentManagementBoard')}</h1>
          <p className={cn("text-gray-600", isTibetan ? 'tibetan' : 'english')}>{t('manageContentAcrossCategories')}</p>
        </div>
        
        <div className={cn("grid max-w-6xl mx-auto grid-cols-1 md:grid-cols-2  gap-6", isTibetan ? 'tibetan' : 'english')}>
          {managementCards.map((card) => (
            <Link
              key={card.titleKey}
              to={card.path}
              className="group"
            >
              <div className=" rounded-lg border   border-gray-200 p-3 shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-kangyur-orange/30">
                <div className="text-center space-y-4 bg-white py-2">
                  <div className="mx-auto w-16 h-16 bg-kangyur-orange/10 hover:bg-kangyur-orange/20 rounded-full flex items-center justify-center transition-colors">
                    <card.icon className="w-8 h-8 text-kangyur-orange" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {t(card.titleKey)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t(card.descriptionKey)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs text-kangyur-orange font-medium group-hover:text-kangyur-maroon transition-colors">
                      {t('manage')} →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
