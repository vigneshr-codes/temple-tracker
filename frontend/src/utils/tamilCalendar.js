import { format, getMonth, getDate, getYear } from 'date-fns';

// Tamil month names in Tamil and English
export const TAMIL_MONTHS = [
  { tamil: 'சித்திரை', english: 'Chithirai', shortForm: 'சித்', approxGregorian: 'Apr-May' },
  { tamil: 'வைகாசி', english: 'Vaikaasi', shortForm: 'வை', approxGregorian: 'May-Jun' },
  { tamil: 'ஆனி', english: 'Aani', shortForm: 'ஆனி', approxGregorian: 'Jun-Jul' },
  { tamil: 'ஆடி', english: 'Aadi', shortForm: 'ஆடி', approxGregorian: 'Jul-Aug' },
  { tamil: 'ஆவணி', english: 'Aavani', shortForm: 'ஆவ', approxGregorian: 'Aug-Sep' },
  { tamil: 'புரட்டாசி', english: 'Purattasi', shortForm: 'புர', approxGregorian: 'Sep-Oct' },
  { tamil: 'ஐப்பசி', english: 'Aippasi', shortForm: 'ஐப்', approxGregorian: 'Oct-Nov' },
  { tamil: 'கார்த்திகை', english: 'Karthikai', shortForm: 'கார்', approxGregorian: 'Nov-Dec' },
  { tamil: 'மார்கழி', english: 'Maargazhi', shortForm: 'மார்', approxGregorian: 'Dec-Jan' },
  { tamil: 'தை', english: 'Thai', shortForm: 'தை', approxGregorian: 'Jan-Feb' },
  { tamil: 'மாசி', english: 'Maasi', shortForm: 'மாசி', approxGregorian: 'Feb-Mar' },
  { tamil: 'பங்குனி', english: 'Panguni', shortForm: 'பங்', approxGregorian: 'Mar-Apr' }
];

// Import comprehensive festival database
import { TAMIL_FESTIVALS_FULL, getMonthFestivals } from './tamilFestivals.js';

// For backward compatibility, maintain the basic TAMIL_FESTIVALS export
export const TAMIL_FESTIVALS = TAMIL_FESTIVALS_FULL;

/**
 * Convert Gregorian date to approximate Tamil calendar
 * This is a simplified conversion based on month mapping
 * For accurate conversions, astronomical calculations would be needed
 */
export function gregorianToTamil(gregorianDate) {
  const date = new Date(gregorianDate);
  const gregorianMonth = getMonth(date); // 0-based month
  const gregorianDay = getDate(date);
  const gregorianYear = getYear(date);
  
  // Simplified mapping - Tamil new year typically starts around April 14
  // This is an approximation and may vary by 1-2 days depending on the year
  let tamilMonthIndex;
  let tamilDay;
  
  if (gregorianMonth === 3 && gregorianDay >= 14) { // April 14+
    tamilMonthIndex = 0; // Chithirai
    tamilDay = gregorianDay - 13;
  } else if (gregorianMonth === 4) { // May
    if (gregorianDay <= 14) {
      tamilMonthIndex = 0; // Chithirai
      tamilDay = gregorianDay + 17; // Approximate
    } else {
      tamilMonthIndex = 1; // Vaikaasi
      tamilDay = gregorianDay - 14;
    }
  } else if (gregorianMonth === 5) { // June
    if (gregorianDay <= 15) {
      tamilMonthIndex = 1; // Vaikaasi
      tamilDay = gregorianDay + 16;
    } else {
      tamilMonthIndex = 2; // Aani
      tamilDay = gregorianDay - 15;
    }
  } else if (gregorianMonth === 6) { // July
    if (gregorianDay <= 16) {
      tamilMonthIndex = 2; // Aani
      tamilDay = gregorianDay + 15;
    } else {
      tamilMonthIndex = 3; // Aadi
      tamilDay = gregorianDay - 16;
    }
  } else if (gregorianMonth === 7) { // August
    if (gregorianDay <= 17) {
      tamilMonthIndex = 3; // Aadi
      tamilDay = gregorianDay + 14;
    } else {
      tamilMonthIndex = 4; // Aavani
      tamilDay = gregorianDay - 17;
    }
  } else if (gregorianMonth === 8) { // September
    if (gregorianDay <= 17) {
      tamilMonthIndex = 4; // Aavani
      tamilDay = gregorianDay + 14;
    } else {
      tamilMonthIndex = 5; // Purattasi
      tamilDay = gregorianDay - 17;
    }
  } else if (gregorianMonth === 9) { // October
    if (gregorianDay <= 17) {
      tamilMonthIndex = 5; // Purattasi
      tamilDay = gregorianDay + 14;
    } else {
      tamilMonthIndex = 6; // Aippasi
      tamilDay = gregorianDay - 17;
    }
  } else if (gregorianMonth === 10) { // November
    if (gregorianDay <= 16) {
      tamilMonthIndex = 6; // Aippasi
      tamilDay = gregorianDay + 15;
    } else {
      tamilMonthIndex = 7; // Karthikai
      tamilDay = gregorianDay - 16;
    }
  } else if (gregorianMonth === 11) { // December
    if (gregorianDay <= 15) {
      tamilMonthIndex = 7; // Karthikai
      tamilDay = gregorianDay + 16;
    } else {
      tamilMonthIndex = 8; // Maargazhi
      tamilDay = gregorianDay - 15;
    }
  } else if (gregorianMonth === 0) { // January
    if (gregorianDay <= 13) {
      tamilMonthIndex = 8; // Maargazhi
      tamilDay = gregorianDay + 17;
    } else {
      tamilMonthIndex = 9; // Thai
      tamilDay = gregorianDay - 13;
    }
  } else if (gregorianMonth === 1) { // February
    if (gregorianDay <= 12) {
      tamilMonthIndex = 9; // Thai
      tamilDay = gregorianDay + 18;
    } else {
      tamilMonthIndex = 10; // Maasi
      tamilDay = gregorianDay - 12;
    }
  } else if (gregorianMonth === 2) { // March
    if (gregorianDay <= 14) {
      tamilMonthIndex = 10; // Maasi
      tamilDay = gregorianDay + 17;
    } else {
      tamilMonthIndex = 11; // Panguni
      tamilDay = gregorianDay - 14;
    }
  } else { // April 1-13
    tamilMonthIndex = 11; // Panguni
    tamilDay = gregorianDay + 16;
  }
  
  // Calculate Tamil year (approximately)
  let tamilYear;
  if (gregorianMonth >= 3 && gregorianDay >= 14) {
    tamilYear = gregorianYear - 1956; // Tamil year offset (approximate)
  } else {
    tamilYear = gregorianYear - 1957;
  }
  
  return {
    month: TAMIL_MONTHS[tamilMonthIndex],
    day: tamilDay,
    year: tamilYear,
    monthIndex: tamilMonthIndex
  };
}

/**
 * Get Tamil festivals for a given Tamil month
 */
export function getTamilFestivals(tamilMonthName) {
  return TAMIL_FESTIVALS[tamilMonthName] || [];
}

/**
 * Format Tamil date for display
 */
export function formatTamilDate(tamilDate, options = {}) {
  const { showYear = true, showEnglish = true, showTamil = true } = options;
  
  let formatted = '';
  
  if (showTamil) {
    formatted += `${tamilDate.month.tamil} ${tamilDate.day}`;
    if (showYear) {
      formatted += `, ${tamilDate.year}`;
    }
  }
  
  if (showTamil && showEnglish) {
    formatted += ' / ';
  }
  
  if (showEnglish) {
    formatted += `${tamilDate.month.english} ${tamilDate.day}`;
    if (showYear) {
      formatted += `, ${tamilDate.year}`;
    }
  }
  
  return formatted;
}

/**
 * Check if a date has any Tamil festivals
 */
export function hasInternationalDatefestivals(gregorianDate) {
  const tamilDate = gregorianToTamil(gregorianDate);
  const festivals = getTamilFestivals(tamilDate.month.english);
  return festivals.some(festival => festival.date === tamilDate.day);
}

/**
 * Get festivals for a specific date
 */
export function getFestivalsForDate(gregorianDate) {
  const tamilDate = gregorianToTamil(gregorianDate);
  const festivals = getTamilFestivals(tamilDate.month.english);
  return festivals.filter(festival => festival.date === tamilDate.day);
}

/**
 * Get formatted date with both Gregorian and Tamil
 */
export function formatDualDate(gregorianDate, options = {}) {
  const { dateFormat = 'dd/MM/yyyy', showFestivals = false } = options;
  
  const gregorianFormatted = format(new Date(gregorianDate), dateFormat);
  const tamilDate = gregorianToTamil(gregorianDate);
  const tamilFormatted = formatTamilDate(tamilDate, { showYear: false });
  
  let result = `${gregorianFormatted} (${tamilFormatted})`;
  
  if (showFestivals) {
    const festivals = getFestivalsForDate(gregorianDate);
    if (festivals.length > 0) {
      const festivalNames = festivals.map(f => f.tamil).join(', ');
      result += ` - ${festivalNames}`;
    }
  }
  
  return result;
}