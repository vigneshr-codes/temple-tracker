// Accurate Tamil Calendar using mhah-panchang package
import { MhahPanchang } from 'mhah-panchang';
import { format, getDate, getMonth, getYear } from 'date-fns';

// Tamil month mapping from Sanskrit names to Tamil names
// Adjusted based on actual Tamil calendar observations
const TAMIL_MONTH_MAPPING = {
  'Chaitra': { tamil: 'பங்குனி', english: 'Panguni', shortForm: 'பங்', season: 'Spring' },
  'Baisakha': { tamil: 'சித்திரை', english: 'Chithirai', shortForm: 'சித்', season: 'Spring' },
  'Jyestha': { tamil: 'வைகாசி', english: 'Vaikasi', shortForm: 'வை', season: 'Summer' },
  'Asadha': { tamil: 'ஆனி', english: 'Aani', shortForm: 'ஆனி', season: 'Summer' },
  'Srabana': { tamil: 'ஆடி', english: 'Aadi', shortForm: 'ஆடி', season: 'Monsoon' },
  'Bhadraba': { tamil: 'ஆவணி', english: 'Aavani', shortForm: 'ஆவ', season: 'Monsoon' },
  'Aswina': { tamil: 'புரட்டாசி', english: 'Purattasi', shortForm: 'புர', season: 'Autumn' },
  'Karttika': { tamil: 'ஐப்பசி', english: 'Aippasi', shortForm: 'ஐப்', season: 'Autumn' },
  'Margasira': { tamil: 'கார்த்திகை', english: 'Karthikai', shortForm: 'கார்', season: 'Pre-Winter' },
  'Pausa': { tamil: 'மார்கழி', english: 'Maargazhi', shortForm: 'மார்', season: 'Winter' },
  'Magha': { tamil: 'தை', english: 'Thai', shortForm: 'தை', season: 'Winter' },
  'Phalguna': { tamil: 'மாசி', english: 'Maasi', shortForm: 'மாசி', season: 'Spring' }
};

// Tamil Tithi names
const TAMIL_TITHI_MAPPING = {
  'Padyami': 'பிரதமை',
  'Vidhiya': 'துவிதியை',
  'Thadiya': 'திருதியை',
  'Chavithi': 'சதுர்த்தி',
  'Chaviti': 'சதுர்த்தி',
  'Panchami': 'பஞ்சமி',
  'Shasti': 'சஷ்டி',
  'Sapthami': 'சப்தமி',
  'Ashtami': 'அஷ்டமி',
  'Navami': 'நவமி',
  'Dasami': 'தசமி',
  'Ekadasi': 'ஏகாதசி',
  'Dvadasi': 'துவாதசி',
  'Trayodasi': 'திரயோதசி',
  'Chaturdasi': 'சதுர்தசி',
  'Punnami': 'பௌர்ணமி',
  'Amavasya': 'அமாவாசை'
};

// Default location coordinates (Chennai)
const DEFAULT_LOCATION = {
  latitude: 13.0827,
  longitude: 80.2707,
  name: 'Chennai'
};

// Initialize panchang calculator
const panchangCalculator = new MhahPanchang();

/**
 * Calculate Tamil day number by finding when the current month started
 */
function calculateTamilDay(currentDate, masaName) {
  const current = new Date(currentDate);
  
  // Go back up to 35 days to find the start of this masa
  for (let i = 0; i < 35; i++) {
    const testDate = new Date(current);
    testDate.setDate(current.getDate() - i);
    
    const testCalendarData = panchangCalculator.calendar(testDate, 13.0827, 80.2707);
    
    // If we find a different masa, the current masa started the next day
    if (testCalendarData.Masa.name_en_IN !== masaName) {
      return i; // Current date is i days into the month
    }
  }
  
  // Fallback: if we can't find the start, use day 1
  return 1;
}

/**
 * Get accurate Tamil calendar data for a given date
 */
export function getAccurateTamilDate(gregorianDate, location = DEFAULT_LOCATION) {
  try {
    const date = new Date(gregorianDate);
    
    // Get basic panchang data
    const basicData = panchangCalculator.calculate(date);
    
    // Get calendar data with location
    const calendarData = panchangCalculator.calendar(
      date, 
      location.latitude, 
      location.longitude
    );
    
    // Map to Tamil format
    const tamilMonth = TAMIL_MONTH_MAPPING[calendarData.Masa.name_en_IN] || {
      tamil: calendarData.Masa.name,
      english: calendarData.Masa.name_en_IN,
      shortForm: calendarData.Masa.name_en_IN.substring(0, 3)
    };
    
    const tamilTithi = TAMIL_TITHI_MAPPING[calendarData.Tithi.name_en_IN] || calendarData.Tithi.name_en_IN;
    
    // Calculate Tamil day by finding when this month started
    const tamilDay = calculateTamilDay(date, calendarData.Masa.name_en_IN);
    
    return {
      gregorianDate: date,
      tamilMonth,
      tamilDay: tamilDay, // Actual Tamil day number (1-30)
      tamilTithi,
      tamilTithiTamil: tamilTithi,
      paksha: calendarData.Paksha.name_en_IN, // Shukla (Waxing) or Krishna (Waning)
      nakshatra: {
        english: calendarData.Nakshatra.name_en_IN,
        tamil: calendarData.Nakshatra.name || calendarData.Nakshatra.name_en_IN
      },
      yoga: {
        english: calendarData.Yoga.name_en_IN,
        tamil: calendarData.Yoga.name || calendarData.Yoga.name_en_IN
      },
      karana: {
        english: calendarData.Karna.name_en_IN,
        tamil: calendarData.Karna.name || calendarData.Karna.name_en_IN
      },
      rashi: {
        english: calendarData.Raasi.name_en_UK,
        tamil: calendarData.Raasi.name || calendarData.Raasi.name_en_UK
      },
      season: {
        english: calendarData.Ritu.name_en_UK,
        tamil: calendarData.Ritu.name || calendarData.Ritu.name_en_UK
      },
      // Additional useful data
      isAmavasai: calendarData.Tithi.name_en_IN === 'Amavasya',
      isPournami: calendarData.Tithi.name_en_IN === 'Punnami',
      isEkadasi: calendarData.Tithi.name_en_IN === 'Ekadasi',
      moonPhase: calendarData.Paksha.name_en_UK,
      // Raw data for advanced usage
      rawData: {
        basic: basicData,
        calendar: calendarData
      }
    };
  } catch (error) {
    console.error('Error calculating Tamil date:', error);
    return null;
  }
}

/**
 * Get festivals and special days for a given date
 */
export function getFestivalsForDate(gregorianDate, location = DEFAULT_LOCATION) {
  const tamilData = getAccurateTamilDate(gregorianDate, location);
  if (!tamilData) return [];
  
  const festivals = [];
  
  // Add festivals based on Tithi (lunar day)
  if (tamilData.isAmavasai) {
    festivals.push({
      name: 'Amavasai',
      tamil: 'அமாவாசை',
      type: 'lunar',
      description: 'New Moon Day - Ancestor worship',
      importance: 'high'
    });
    
    // Special Amavasai days
    if (tamilData.tamilMonth.english === 'Purattasi') {
      festivals.push({
        name: 'Mahalaya Amavasai',
        tamil: 'மகாளய அமாவாசை',
        type: 'major',
        description: 'Most important day for ancestor worship',
        importance: 'major'
      });
    } else if (tamilData.tamilMonth.english === 'Aadi') {
      festivals.push({
        name: 'Aadi Amavasai',
        tamil: 'ஆடி அமாவாசை',
        type: 'major',
        description: 'Important Amavasai for ancestors',
        importance: 'high'
      });
    }
  }
  
  if (tamilData.isPournami) {
    festivals.push({
      name: 'Pournami',
      tamil: 'பௌர்ணமி',
      type: 'lunar',
      description: 'Full Moon Day',
      importance: 'medium'
    });
    
    // Special Pournami days
    if (tamilData.tamilMonth.english === 'Maasi') {
      festivals.push({
        name: 'Maasi Magam',
        tamil: 'மாசி மகம்',
        type: 'major',
        description: 'Holy dip festival',
        importance: 'major'
      });
    } else if (tamilData.tamilMonth.english === 'Panguni') {
      festivals.push({
        name: 'Panguni Uthiram',
        tamil: 'பங்குனி உத்திரம்',
        type: 'major',
        description: 'Divine marriage festival',
        importance: 'major'
      });
    }
  }
  
  if (tamilData.isEkadasi) {
    festivals.push({
      name: 'Ekadasi',
      tamil: 'ஏகாதசி',
      type: 'spiritual',
      description: 'Fasting day for Lord Vishnu',
      importance: 'medium'
    });
    
    // Special Ekadasi days
    if (tamilData.tamilMonth.english === 'Maargazhi') {
      festivals.push({
        name: 'Vaikunta Ekadasi',
        tamil: 'வைகுண்ட ஏகாதசி',
        type: 'major',
        description: 'Gateway to heaven opens',
        importance: 'major'
      });
    }
  }
  
  // Month-specific festivals
  addMonthSpecificFestivals(festivals, tamilData);
  
  return festivals;
}

/**
 * Add month-specific festivals
 */
function addMonthSpecificFestivals(festivals, tamilData) {
  const month = tamilData.tamilMonth.english;
  const tithi = tamilData.tamilDay;
  
  // Add major festivals based on month and specific conditions
  switch (month) {
    case 'Chithirai':
      if (tamilData.gregorianDate.getDate() === 14 && tamilData.gregorianDate.getMonth() === 3) {
        festivals.push({
          name: 'Tamil New Year',
          tamil: 'தமிழ் புத்தாண்டு',
          type: 'major',
          description: 'Tamil New Year celebration',
          importance: 'major'
        });
      }
      break;
      
    case 'Vaikasi':
      if (tamilData.nakshatra.english === 'Vishakha') {
        festivals.push({
          name: 'Vaikasi Visakam',
          tamil: 'வைகாசி விசாகம்',
          type: 'major',
          description: 'Birth star of Lord Murugan',
          importance: 'major'
        });
      }
      break;
      
    case 'Aadi':
      // Aadi Fridays
      if (tamilData.gregorianDate.getDay() === 5) { // Friday
        festivals.push({
          name: 'Aadi Velli',
          tamil: 'ஆடி வெள்ளி',
          type: 'weekly',
          description: 'Special Friday for goddess worship',
          importance: 'medium'
        });
      }
      break;
      
    case 'Karthikai':
      if (tamilData.isPournami) {
        festivals.push({
          name: 'Karthikai Deepam',
          tamil: 'கார்த்திகை தீபம்',
          type: 'major',
          description: 'Festival of lights',
          importance: 'major'
        });
      }
      break;
      
    case 'Maargazhi':
      festivals.push({
        name: 'Maargazhi Month',
        tamil: 'மார்கழி மாதம்',
        type: 'devotional',
        description: 'Holy month of devotion',
        importance: 'high'
      });
      break;
      
    case 'Thai':
      if (tithi === 'Punnami') {
        festivals.push({
          name: 'Thai Poosam',
          tamil: 'தைப்பூசம்',
          type: 'major',
          description: 'Murugan festival with Kavadi',
          importance: 'major'
        });
      }
      break;
  }
}

/**
 * Get upcoming important days (next 30 days)
 */
export function getUpcomingImportantDays(fromDate = new Date(), days = 30) {
  const upcomingDays = [];
  const startDate = new Date(fromDate);
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const festivals = getFestivalsForDate(currentDate);
    if (festivals.length > 0) {
      upcomingDays.push({
        date: currentDate,
        festivals: festivals.filter(f => f.importance === 'major' || f.importance === 'high')
      });
    }
  }
  
  return upcomingDays;
}

/**
 * Format Tamil date for display
 */
export function formatTamilDate(gregorianDate, options = {}) {
  const { showYear = true, showEnglish = true, showTamil = true, showDay = true } = options;
  
  const tamilData = getAccurateTamilDate(gregorianDate);
  if (!tamilData) return 'Date calculation error';
  
  let formatted = '';
  
  if (showTamil) {
    formatted += `${tamilData.tamilMonth.tamil}`;
    if (showDay) {
      formatted += ` ${tamilData.tamilDay}`;
    }
  }
  
  if (showTamil && showEnglish) {
    formatted += ' / ';
  }
  
  if (showEnglish) {
    formatted += `${tamilData.tamilMonth.english}`;
    if (showDay) {
      formatted += ` ${tamilData.tamilDay}`;
    }
  }
  
  return formatted;
}

// Export for backward compatibility
export { getAccurateTamilDate as gregorianToTamil };
export const TAMIL_MONTHS = Object.values(TAMIL_MONTH_MAPPING);