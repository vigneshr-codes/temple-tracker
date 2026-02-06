import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TAMIL_MONTHS,
  getAccurateTamilDate,
  getUpcomingImportantDays,
  getFestivalsForDate
} from '../../utils/tamilCalendarAccurate';
import {
  CalendarDaysIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const TamilYearCalendar = ({ year = new Date().getFullYear() }) => {
  const { t } = useTranslation();
  const [expandedMonths, setExpandedMonths] = useState({});
  const [selectedTypes, setSelectedTypes] = useState(['major', 'high', 'medium']);
  const [showAllTypes, setShowAllTypes] = useState(false);
  
  const currentDate = new Date();
  const currentTamilData = getAccurateTamilDate(currentDate);
  
  const toggleMonth = (monthName) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthName]: !prev[monthName]
    }));
  };
  
  const toggleAllMonths = (expand) => {
    const newState = {};
    TAMIL_MONTHS.forEach(month => {
      newState[month.english] = expand;
    });
    setExpandedMonths(newState);
  };
  
  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedTypes(prev => [...prev, type]);
    }
  };
  
  // Get festivals for a specific month by checking each day
  const getMonthFestivals = (monthIndex) => {
    const festivals = [];
    const monthStart = new Date(year, 3 + monthIndex, 14); // Tamil year starts around April 14
    
    // Check approximately 30 days for this Tamil month
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(monthStart);
      currentDate.setDate(monthStart.getDate() + day);
      
      const dayFestivals = getFestivalsForDate(currentDate);
      dayFestivals.forEach(festival => {
        festivals.push({
          ...festival,
          date: currentDate,
          gregorianDate: currentDate.getDate(),
          gregorianMonth: currentDate.getMonth()
        });
      });
    }
    
    return festivals;
  };

  const getFilteredFestivals = (monthIndex) => {
    const allFestivals = getMonthFestivals(monthIndex);
    if (showAllTypes) return allFestivals;
    return allFestivals.filter(f => selectedTypes.includes(f.importance));
  };
  
  const getFestivalColor = (importance) => {
    const colorMap = {
      'major': 'bg-red-100 text-red-800 border-red-300',
      'high': 'bg-orange-100 text-orange-800 border-orange-300', 
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'spiritual': 'bg-purple-100 text-purple-800 border-purple-300',
      'lunar': 'bg-blue-100 text-blue-800 border-blue-300',
      'weekly': 'bg-green-100 text-green-800 border-green-300',
      'devotional': 'bg-indigo-100 text-indigo-800 border-indigo-300'
    };
    
    return colorMap[importance] || 'bg-gray-100 text-gray-800 border-gray-300';
  };
  
  return (
    <div className="tamil-year-calendar">
      {/* Header */}
      <div className="bg-gradient-to-r from-temple-600 to-saffron-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{t('calendar.tamilYearCalendar')}</h2>
              <p className="text-temple-100">
                Tamil Year {year - 1956} - {year - 1955} | Gregorian {year}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => toggleAllMonths(true)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm"
            >
              {t('calendar.expandAll')}
            </button>
            <button
              onClick={() => toggleAllMonths(false)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm"
            >
              {t('calendar.collapseAll')}
            </button>
          </div>
        </div>
        
        {/* Current Tamil Date Display */}
        {currentTamilData && (
          <div className="bg-white/10 rounded-md p-3">
            <div className="text-sm text-temple-100 mb-1">{t('common.today')}</div>
            <div className="text-lg font-semibold">
              {currentTamilData.tamilMonth.tamil} {currentTamilData.tamilTithi}
            </div>
            <div className="text-sm text-temple-100">
              {currentDate.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Filter Section */}
      <div className="bg-gray-50 border-x border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">{t('calendar.filterByType')}</span>
          </div>
          <button
            onClick={() => setShowAllTypes(!showAllTypes)}
            className="text-sm text-temple-600 hover:text-temple-800"
          >
            {showAllTypes ? t('calendar.applyFilters') : t('calendar.showAll')}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'major', label: 'முக்கிய' },
            { key: 'high', label: 'உயர்' },
            { key: 'medium', label: 'நடுத்தர' },
            { key: 'spiritual', label: 'ஆன்மீகம்' },
            { key: 'lunar', label: 'சந்திர' },
            { key: 'weekly', label: 'வாராந்திர' },
            { key: 'devotional', label: 'பக்தி' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleType(key)}
              disabled={showAllTypes}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                showAllTypes || selectedTypes.includes(key)
                  ? getFestivalColor(key)
                  : 'bg-white text-gray-500 border-gray-300 opacity-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Months Grid */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-lg">
        {TAMIL_MONTHS.map((month, monthIndex) => {
          const festivals = getFilteredFestivals(monthIndex);
          const majorFestivals = festivals.filter(f => f.importance === 'major');
          const isExpanded = expandedMonths[month.english];
          const isCurrentMonth = currentTamilData && currentTamilData.tamilMonth.english === month.english;
          
          return (
            <div 
              key={month.english}
              className={`border-b border-gray-200 last:border-b-0 ${
                isCurrentMonth ? 'bg-temple-50' : ''
              }`}
            >
              {/* Month Header */}
              <div 
                onClick={() => toggleMonth(month.english)}
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-temple-700">
                        {month.tamil}
                      </span>
                      <span className="text-gray-600">
                        {month.english}
                      </span>
                      {isCurrentMonth && (
                        <span className="px-2 py-0.5 bg-temple-600 text-white text-xs rounded-full">
                          Current Month
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {month.approxGregorian}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {festivals.length} events
                    </span>
                    {majorFestivals.length > 0 && (
                      <span className="flex items-center space-x-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        <SparklesIcon className="w-3 h-3" />
                        <span>{majorFestivals.length} major</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {isExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {/* Festivals List */}
              {isExpanded && festivals.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="grid gap-2">
                    {festivals.map((festival, index) => {
                      const festivalColor = getFestivalColor(festival.importance);
                      
                      return (
                        <div 
                          key={index}
                          className={`border rounded-lg p-3 ${festivalColor}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-lg">
                                  {festival.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                                  {festival.importance}
                                </span>
                              </div>
                              <div className="font-medium">
                                {festival.tamil}
                              </div>
                              <div className="text-sm opacity-90">
                                {festival.name}
                              </div>
                              {festival.description && (
                                <div className="text-xs mt-1 opacity-75">
                                  {festival.description}
                                </div>
                              )}
                            </div>
                            {festival.importance === 'major' && (
                              <SparklesIcon className="w-5 h-5 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {isExpanded && festivals.length === 0 && (
                <div className="px-4 pb-4">
                  <div className="text-center text-gray-500 py-4">
                    No events match the selected filters
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer Summary */}
      <div className="bg-gray-50 p-4 rounded-b-lg border-x border-b border-gray-200 mt-1">
        <div className="text-center text-sm text-gray-600">
          <div className="font-medium mb-1">Tamil Calendar with Accurate Astronomical Data</div>
          <div className="text-xs text-gray-500">
            Powered by mhah-panchang library for precise lunar calculations
          </div>
        </div>
      </div>
    </div>
  );
};

export default TamilYearCalendar;