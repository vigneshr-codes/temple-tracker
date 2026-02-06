import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getAccurateTamilDate, 
  formatTamilDate, 
  getFestivalsForDate,
  TAMIL_MONTHS 
} from '../../utils/tamilCalendarAccurate';
import { 
  CalendarDaysIcon, 
  SparklesIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

const TamilCalendarWidget = ({ 
  initialDate = new Date(),
  showNavigation = true,
  className = '',
  compact = false
}) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));
  const [showFestivalDetails, setShowFestivalDetails] = useState(false);
  
  const tamilData = getAccurateTamilDate(currentDate);
  const festivals = getFestivalsForDate(currentDate);
  
  if (!tamilData) return null;
  
  const gregorianFormatted = currentDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Auto-update to current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (currentDate.toDateString() === new Date(initialDate).toDateString()) {
        setCurrentDate(now);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [currentDate, initialDate]);
  
  if (compact) {
    return (
      <div className={`tamil-calendar-widget-compact bg-gradient-to-br from-temple-50 to-saffron-50 border border-temple-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="w-5 h-5 text-temple-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </div>
              <div className="text-xs text-temple-600">
                {tamilData.tamilMonth.shortForm} {tamilData.tamilTithi}
              </div>
            </div>
          </div>
          
          {festivals.length > 0 && (
            <div className="flex items-center space-x-1">
              <SparklesIcon className="w-4 h-4 text-saffron-500" />
              <span className="text-xs text-saffron-700 font-medium">
                {festivals.length} festival{festivals.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`tamil-calendar-widget bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-temple-600 to-saffron-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="w-6 h-6" />
            <h3 className="text-lg font-semibold">{t('calendar.tamilCalendar')}</h3>
          </div>
          
          {showNavigation && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate(-1)}
                className="p-1 rounded-md hover:bg-white/20 transition-colors"
                title="Previous day"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-medium bg-white/20 rounded-md hover:bg-white/30 transition-colors"
              >
                {t('common.today')}
              </button>
              
              <button
                onClick={() => navigateDate(1)}
                className="p-1 rounded-md hover:bg-white/20 transition-colors"
                title="Next day"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Date Display */}
      <div className="p-4">
        {/* Gregorian Date */}
        <div className="mb-3">
          <span className="text-sm text-gray-500">{t('calendar.gregorian')}</span>
          <div className="text-lg font-semibold text-gray-900">{gregorianFormatted}</div>
        </div>
        
        {/* Tamil Date */}
        <div className="mb-4">
          <span className="text-sm text-gray-500">{t('calendar.tamil')}</span>
          <div className="text-lg font-semibold text-temple-700">
            {formatTamilDate(currentDate, { showYear: true, showEnglish: false, showTamil: true })}
          </div>
          <div className="text-sm text-temple-600">
            {tamilData.tamilMonth.english} - {tamilData.season.english} Season
          </div>
        </div>
        
        {/* Festivals */}
        {festivals.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-saffron-500" />
                <span className="text-sm font-medium text-gray-900">
                  Festival{festivals.length > 1 ? 's' : ''} Today
                </span>
              </div>
              
              {festivals.length > 1 && (
                <button
                  onClick={() => setShowFestivalDetails(!showFestivalDetails)}
                  className="text-xs text-temple-600 hover:text-temple-800"
                >
                  {showFestivalDetails ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {festivals.slice(0, showFestivalDetails ? festivals.length : 1).map((festival, index) => (
                <div key={index} className="bg-saffron-50 border border-saffron-200 rounded-md p-3">
                  <div className="font-medium text-saffron-800">{festival.tamil}</div>
                  <div className="text-sm text-saffron-700">{festival.name}</div>
                  {festival.description && (
                    <div className="text-xs text-gray-600 mt-1">{festival.description}</div>
                  )}
                </div>
              ))}
              
              {festivals.length > 1 && !showFestivalDetails && (
                <div className="text-xs text-gray-500 text-center">
                  +{festivals.length - 1} more festival{festivals.length - 1 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}
        
        {festivals.length === 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-center text-gray-500">
              <CalendarDaysIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span className="text-sm">No festivals today</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Tamil Month Info */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Tamil Month:</span> {tamilData.tamilMonth.english} 
          <span className="ml-1">({tamilData.tamilMonth.tamil})</span> • 
          <span className="font-medium ml-1">Tithi:</span> {tamilData.tamilTithi}
        </div>
      </div>
    </div>
  );
};

export default TamilCalendarWidget;