import React, { memo, useMemo } from 'react';
import { getAccurateTamilDate, formatTamilDate, getFestivalsForDate } from '../../utils/tamilCalendarAccurate';
import { CalendarDaysIcon, SparklesIcon } from '@heroicons/react/24/outline';

const TamilDateDisplay = memo(({ 
  date, 
  showGregorian = true, 
  showTamil = true, 
  showFestivals = true,
  showYear = true,
  className = '',
  variant = 'inline' // 'inline', 'card', 'badge'
}) => {
  if (!date) return null;
  
  // Memoize expensive calculations
  const { gregorianDate, tamilData, festivals, gregorianFormatted, tamilFormatted } = useMemo(() => {
    const gregorianDate = new Date(date);
    const tamilData = getAccurateTamilDate(gregorianDate);
    const festivals = getFestivalsForDate(gregorianDate);
    
    if (!tamilData) return { gregorianDate, tamilData: null, festivals: [], gregorianFormatted: '', tamilFormatted: '' };
    
    // Format dates
    const gregorianFormatted = gregorianDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: showYear ? 'long' : '2-digit',
      year: showYear ? 'numeric' : undefined
    });
    
    const tamilFormatted = formatTamilDate(gregorianDate, { 
      showYear, 
      showEnglish: false, 
      showTamil: true 
    });
    
    return {
      gregorianDate,
      tamilData,
      festivals,
      gregorianFormatted,
      tamilFormatted
    };
  }, [date, showYear]);
  
  if (!tamilData) return null;
  
  // Inline variant - simple text display
  if (variant === 'inline') {
    return (
      <span className={`tamil-date-display ${className}`}>
        {showGregorian && <span className="gregorian-date">{gregorianFormatted}</span>}
        {showGregorian && showTamil && <span className="date-separator"> / </span>}
        {showTamil && <span className="tamil-date text-temple-600">{tamilFormatted}</span>}
        {showFestivals && festivals.length > 0 && (
          <span className="festivals text-saffron-600 text-xs ml-2">
            <SparklesIcon className="w-3 h-3 inline mr-1" />
            {festivals.map(f => f.tamil).join(', ')}
          </span>
        )}
      </span>
    );
  }
  
  // Badge variant - compact display
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {showGregorian && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
            <CalendarDaysIcon className="w-3 h-3 mr-1" />
            {gregorianFormatted}
          </span>
        )}
        {showTamil && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-temple-100 text-temple-800">
            {tamilFormatted}
          </span>
        )}
        {showFestivals && festivals.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-saffron-100 text-saffron-800">
            <SparklesIcon className="w-3 h-3 mr-1" />
            {festivals.length} festival{festivals.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }
  
  // Card variant - detailed display
  if (variant === 'card') {
    return (
      <div className={`tamil-date-card bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <CalendarDaysIcon className="w-5 h-5 text-temple-600" />
          {festivals.length > 0 && (
            <SparklesIcon className="w-5 h-5 text-saffron-500" />
          )}
        </div>
        
        {showGregorian && (
          <div className="gregorian-date mb-1">
            <span className="text-sm text-gray-500">Gregorian:</span>
            <span className="text-lg font-medium text-gray-900 ml-2">{gregorianFormatted}</span>
          </div>
        )}
        
        {showTamil && (
          <div className="tamil-date mb-2">
            <span className="text-sm text-gray-500">Tamil:</span>
            <span className="text-lg font-medium text-temple-700 ml-2">{tamilFormatted}</span>
            <div className="text-xs text-gray-400 mt-1">
              {tamilData.tamilMonth.english} - {tamilData.season.english} Season
            </div>
          </div>
        )}
        
        {showFestivals && festivals.length > 0 && (
          <div className="festivals">
            <span className="text-sm text-gray-500 block mb-1">Festivals:</span>
            <div className="space-y-1">
              {festivals.map((festival, index) => (
                <div key={index} className="bg-saffron-50 border border-saffron-200 rounded-md p-2">
                  <div className="font-medium text-saffron-800">{festival.tamil}</div>
                  <div className="text-xs text-saffron-600">{festival.name}</div>
                  {festival.description && (
                    <div className="text-xs text-gray-600 mt-1">{festival.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
});

TamilDateDisplay.displayName = 'TamilDateDisplay';

export default TamilDateDisplay;