// Comprehensive Tamil Festival Calendar with Full Year Events
// This includes major Tamil festivals, temple festivals, and auspicious days

export const TAMIL_FESTIVALS_FULL = {
  'Chithirai': [ // சித்திரை (Apr-May)
    { date: 1, name: 'Chithirai Month Begins', tamil: 'சித்திரை மாதம் தொடக்கம்', type: 'month_start' },
    { date: 14, name: 'Tamil New Year', tamil: 'தமிழ் புத்தாண்டு', type: 'major', description: 'Tamil New Year - Beginning of new Tamil calendar year' },
    { date: 14, name: 'Vishu', tamil: 'விஷு', type: 'festival', description: 'Malayalam New Year' },
    { date: 15, name: 'Chithirai Pournami', tamil: 'சித்திரை பௌர்ணமி', type: 'pournami', description: 'Full moon day' },
    { date: 20, name: 'Chithirai Thiruvizha', tamil: 'சித்திரை திருவிழா', type: 'temple', description: 'Madurai Meenakshi temple festival' },
    { date: 30, name: 'Chithirai Amavasai', tamil: 'சித்திரை அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Vaikaasi': [ // வைகாசி (May-Jun)
    { date: 1, name: 'Vaikasi Month Begins', tamil: 'வைகாசி மாதம் தொடக்கம்', type: 'month_start' },
    { date: 10, name: 'Akshaya Tritiya', tamil: 'அக்ஷய திருதியை', type: 'auspicious', description: 'Auspicious day for new beginnings' },
    { date: 15, name: 'Vaikasi Pournami', tamil: 'வைகாசி பௌர்ணமி', type: 'pournami', description: 'Buddha Purnima - Full moon' },
    { date: 20, name: 'Vaikasi Visakam', tamil: 'வைகாசி விசாகம்', type: 'major', description: 'Birth star of Lord Murugan' },
    { date: 30, name: 'Vaikasi Amavasai', tamil: 'வைகாசி அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Aani': [ // ஆனி (Jun-Jul)
    { date: 1, name: 'Aani Month Begins', tamil: 'ஆனி மாதம் தொடக்கம்', type: 'month_start' },
    { date: 10, name: 'Aani Thirumanjanam', tamil: 'ஆனி திருமஞ்சனம்', type: 'temple', description: 'Sacred bath for deities in temples' },
    { date: 15, name: 'Aani Pournami', tamil: 'ஆனி பௌர்ணமி', type: 'pournami', description: 'Full moon day' },
    { date: 18, name: 'Aani Uthiram', tamil: 'ஆனி உத்திரம்', type: 'temple', description: 'Important day for Nataraja temples' },
    { date: 30, name: 'Aani Amavasai', tamil: 'ஆனி அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Aadi': [ // ஆடி (Jul-Aug)
    { date: 1, name: 'Aadi Month Begins', tamil: 'ஆடி மாதம் தொடக்கம்', type: 'month_start', description: 'Auspicious month for Amman worship' },
    { date: 3, name: 'Aadi Velli', tamil: 'ஆடி வெள்ளி', type: 'weekly', description: 'Special Friday for goddess worship' },
    { date: 10, name: 'Aadi Velli', tamil: 'ஆடி வெள்ளி', type: 'weekly', description: 'Special Friday for goddess worship' },
    { date: 15, name: 'Aadi Pournami', tamil: 'ஆடி பௌர்ணமி', type: 'pournami', description: 'Full moon day' },
    { date: 17, name: 'Aadi Velli', tamil: 'ஆடி வெள்ளி', type: 'weekly', description: 'Special Friday for goddess worship' },
    { date: 18, name: 'Aadi Perukku', tamil: 'ஆடி பெருக்கு', type: 'major', description: 'Monsoon festival - River worship' },
    { date: 24, name: 'Aadi Velli', tamil: 'ஆடி வெள்ளி', type: 'weekly', description: 'Special Friday for goddess worship' },
    { date: 30, name: 'Aadi Amavasai', tamil: 'ஆடி அமாவாசை', type: 'amavasai', description: 'Important new moon for ancestor worship' }
  ],
  
  'Aavani': [ // ஆவணி (Aug-Sep)
    { date: 1, name: 'Aavani Month Begins', tamil: 'ஆவணி மாதம் தொடக்கம்', type: 'month_start' },
    { date: 4, name: 'Vinayaka Chaturthi', tamil: 'விநாயக சதுர்த்தி', type: 'major', description: 'Ganesha Chaturthi festival' },
    { date: 12, name: 'Krishna Jayanthi', tamil: 'கிருஷ்ண ஜயந்தி', type: 'major', description: 'Birth of Lord Krishna' },
    { date: 15, name: 'Aavani Avittam', tamil: 'ஆவணி அவிட்டம்', type: 'major', description: 'Sacred thread changing ceremony' },
    { date: 15, name: 'Aavani Pournami', tamil: 'ஆவணி பௌர்ணமி', type: 'pournami', description: 'Full moon - Raksha Bandhan' },
    { date: 21, name: 'Varalakshmi Vratham', tamil: 'வரலட்சுமி விரதம்', type: 'festival', description: 'Goddess Lakshmi worship' },
    { date: 30, name: 'Aavani Amavasai', tamil: 'ஆவணி அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Purattasi': [ // புரட்டாசி (Sep-Oct)
    { date: 1, name: 'Purattasi Month Begins', tamil: 'புரட்டாசி மாதம் தொடக்கம்', type: 'month_start', description: 'Month dedicated to Lord Vishnu' },
    { date: 5, name: 'Purattasi Sani', tamil: 'புரட்டாசி சனி', type: 'weekly', description: 'Saturday - Vishnu worship' },
    { date: 12, name: 'Purattasi Sani', tamil: 'புரட்டாசி சனி', type: 'weekly', description: 'Saturday - Vishnu worship' },
    { date: 15, name: 'Purattasi Pournami', tamil: 'புரட்டாசி பௌர்ணமி', type: 'pournami', description: 'Full moon day' },
    { date: 17, name: 'Mahalaya Paksha', tamil: 'மகாளய பக்ஷம்', type: 'ancestor', description: 'Fortnight for ancestor rituals begins' },
    { date: 19, name: 'Purattasi Sani', tamil: 'புரட்டாசி சனி', type: 'weekly', description: 'Saturday - Vishnu worship' },
    { date: 26, name: 'Purattasi Sani', tamil: 'புரட்டாசி சனி', type: 'weekly', description: 'Saturday - Vishnu worship' },
    { date: 30, name: 'Mahalaya Amavasai', tamil: 'மகாளய அமாவாசை', type: 'amavasai', description: 'Most important day for ancestor worship' }
  ],
  
  'Aippasi': [ // ஐப்பசி (Oct-Nov)
    { date: 1, name: 'Aippasi Month Begins', tamil: 'ஐப்பசி மாதம் தொடக்கம்', type: 'month_start' },
    { date: 1, name: 'Navaratri Begins', tamil: 'நவராத்திரி தொடக்கம்', type: 'major', description: 'Nine nights festival begins' },
    { date: 7, name: 'Saraswati Puja', tamil: 'சரஸ்வதி பூஜை', type: 'festival', description: 'Worship of goddess of learning' },
    { date: 8, name: 'Ayudha Puja', tamil: 'ஆயுத பூஜை', type: 'festival', description: 'Worship of tools and instruments' },
    { date: 9, name: 'Vijaya Dasami', tamil: 'விஜய தசமி', type: 'major', description: 'Victory day - End of Navaratri' },
    { date: 15, name: 'Aippasi Pournami', tamil: 'ஐப்பசி பௌர்ணமி', type: 'pournami', description: 'Full moon - Annabishekam' },
    { date: 20, name: 'Kedara Gauri Vratham', tamil: 'கேதார கௌரி விரதம்', type: 'vratham', description: 'Fasting for Goddess Parvati' },
    { date: 30, name: 'Aippasi Amavasai', tamil: 'ஐப்பசி அமாவாசை', type: 'amavasai', description: 'Deepavali Amavasai' }
  ],
  
  'Karthikai': [ // கார்த்திகை (Nov-Dec)
    { date: 1, name: 'Karthikai Month Begins', tamil: 'கார்த்திகை மாதம் தொடக்கம்', type: 'month_start', description: 'Month of lights' },
    { date: 1, name: 'Deepavali', tamil: 'தீபாவளி', type: 'major', description: 'Festival of lights' },
    { date: 6, name: 'Soorasamharam', tamil: 'சூரசம்ஹாரம்', type: 'temple', description: 'Skanda Shasti - Victory over evil' },
    { date: 7, name: 'Karthikai Somavaram', tamil: 'கார்த்திகை சோமவாரம்', type: 'weekly', description: 'Monday fasting for Shiva' },
    { date: 14, name: 'Karthikai Somavaram', tamil: 'கார்த்திகை சோமவாரம்', type: 'weekly', description: 'Monday fasting for Shiva' },
    { date: 15, name: 'Karthikai Deepam', tamil: 'கார்த்திகை தீபம்', type: 'major', description: 'Festival of lights - Full moon' },
    { date: 21, name: 'Karthikai Somavaram', tamil: 'கார்த்திகை சோமவாரம்', type: 'weekly', description: 'Monday fasting for Shiva' },
    { date: 28, name: 'Karthikai Somavaram', tamil: 'கார்த்திகை சோமவாரம்', type: 'weekly', description: 'Monday fasting for Shiva' },
    { date: 30, name: 'Karthikai Amavasai', tamil: 'கார்த்திகை அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Maargazhi': [ // மார்கழி (Dec-Jan)
    { date: 1, name: 'Maargazhi Month Begins', tamil: 'மார்கழி மாதம் தொடக்கம்', type: 'month_start', description: 'Most sacred month for devotion' },
    { date: 1, name: 'Maargazhi Bhajans Begin', tamil: 'மார்கழி பஜனை தொடக்கம்', type: 'devotion', description: 'Early morning devotional songs begin' },
    { date: 5, name: 'Karthikai Deepam Festival', tamil: 'திருவண்ணாமலை தீபம்', type: 'temple', description: 'Thiruvannamalai Deepam' },
    { date: 10, name: 'Vaikunta Ekadasi', tamil: 'வைகுண்ட ஏகாதசி', type: 'major', description: 'Gateway to heaven opens' },
    { date: 15, name: 'Maargazhi Pournami', tamil: 'மார்கழி பௌர்ணமி', type: 'pournami', description: 'Thiruvadhirai - Ardra Darshan' },
    { date: 16, name: 'Thiruvadhirai', tamil: 'திருவாதிரை', type: 'major', description: 'Cosmic dance of Nataraja' },
    { date: 25, name: 'Hanuman Jayanthi', tamil: 'ஹனுமான் ஜயந்தி', type: 'festival', description: 'Birth of Lord Hanuman' },
    { date: 30, name: 'Maargazhi Amavasai', tamil: 'மார்கழி அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Thai': [ // தை (Jan-Feb)
    { date: 1, name: 'Thai Month Begins', tamil: 'தை மாதம் தொடக்கம்', type: 'month_start', description: 'Thai Pirandhal Vazhi Pirakkum' },
    { date: 14, name: 'Makara Sankranti', tamil: 'மகர சங்கராந்தி', type: 'harvest', description: 'Sun enters Capricorn' },
    { date: 15, name: 'Pongal', tamil: 'பொங்கல்', type: 'major', description: 'Tamil harvest festival' },
    { date: 15, name: 'Thai Pournami', tamil: 'தை பௌர்ணமி', type: 'pournami', description: 'Full moon day' },
    { date: 16, name: 'Mattu Pongal', tamil: 'மாட்டுப் பொங்கல்', type: 'festival', description: 'Cattle worship day' },
    { date: 17, name: 'Kaanum Pongal', tamil: 'காணும் பொங்கல்', type: 'festival', description: 'Family reunion day' },
    { date: 18, name: 'Thai Poosam', tamil: 'தைப்பூசம்', type: 'major', description: 'Murugan festival - Kavadi' },
    { date: 25, name: 'Republic Day', tamil: 'குடியரசு தினம்', type: 'national', description: 'National holiday' },
    { date: 30, name: 'Thai Amavasai', tamil: 'தை அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Maasi': [ // மாசி (Feb-Mar)
    { date: 1, name: 'Maasi Month Begins', tamil: 'மாசி மாதம் தொடக்கம்', type: 'month_start' },
    { date: 5, name: 'Vasant Panchami', tamil: 'வசந்த பஞ்சமி', type: 'festival', description: 'Spring festival' },
    { date: 13, name: 'Maha Shivaratri', tamil: 'மகா சிவராத்திரி', type: 'major', description: 'Great night of Lord Shiva' },
    { date: 15, name: 'Maasi Magam', tamil: 'மாசி மகம்', type: 'major', description: 'Holy dip festival - Full moon' },
    { date: 20, name: 'Maasi Makam', tamil: 'மாசி மகம்', type: 'temple', description: 'Float festival in temples' },
    { date: 30, name: 'Maasi Amavasai', tamil: 'மாசி அமாவாசை', type: 'amavasai', description: 'New moon day' }
  ],
  
  'Panguni': [ // பங்குனி (Mar-Apr)
    { date: 1, name: 'Panguni Month Begins', tamil: 'பங்குனி மாதம் தொடக்கம்', type: 'month_start' },
    { date: 8, name: 'Holi', tamil: 'ஹோலி', type: 'festival', description: 'Festival of colors' },
    { date: 14, name: 'Karadayan Nombu', tamil: 'காரடையான் நோன்பு', type: 'vratham', description: 'Married women fast' },
    { date: 15, name: 'Panguni Uthiram', tamil: 'பங்குனி உத்திரம்', type: 'major', description: 'Divine marriages - Full moon' },
    { date: 17, name: 'Ramanavami', tamil: 'ராம நவமி', type: 'festival', description: 'Birth of Lord Rama' },
    { date: 25, name: 'Tamil New Year Eve', tamil: 'தமிழ் புத்தாண்டு முன்தினம்', type: 'preparation', description: 'Preparations for new year' },
    { date: 30, name: 'Panguni Amavasai', tamil: 'பங்குனி அமாவாசை', type: 'amavasai', description: 'Last new moon of Tamil year' }
  ]
};

// Helper function to get all festivals for a Tamil month
export function getMonthFestivals(monthName) {
  return TAMIL_FESTIVALS_FULL[monthName] || [];
}

// Helper function to get major festivals only
export function getMajorFestivals(monthName) {
  const festivals = TAMIL_FESTIVALS_FULL[monthName] || [];
  return festivals.filter(f => f.type === 'major');
}

// Helper function to get festivals by type
export function getFestivalsByType(type) {
  const allFestivals = [];
  Object.keys(TAMIL_FESTIVALS_FULL).forEach(month => {
    const monthFestivals = TAMIL_FESTIVALS_FULL[month].filter(f => f.type === type);
    monthFestivals.forEach(festival => {
      allFestivals.push({ ...festival, month });
    });
  });
  return allFestivals;
}

// Festival types for categorization
export const FESTIVAL_TYPES = {
  major: { name: 'Major Festivals', tamil: 'முக்கிய திருவிழாக்கள்', color: 'red' },
  festival: { name: 'Festivals', tamil: 'திருவிழாக்கள்', color: 'orange' },
  temple: { name: 'Temple Festivals', tamil: 'கோவில் திருவிழாக்கள்', color: 'purple' },
  vratham: { name: 'Vratham Days', tamil: 'விரத நாட்கள்', color: 'yellow' },
  pournami: { name: 'Full Moon', tamil: 'பௌர்ணமி', color: 'blue' },
  amavasai: { name: 'New Moon', tamil: 'அமாவாசை', color: 'gray' },
  weekly: { name: 'Weekly Observances', tamil: 'வார விரதங்கள்', color: 'green' },
  harvest: { name: 'Harvest Festivals', tamil: 'அறுவடை திருவிழாக்கள்', color: 'amber' },
  devotion: { name: 'Devotional Days', tamil: 'பக்தி நாட்கள்', color: 'indigo' },
  ancestor: { name: 'Ancestor Worship', tamil: 'பித்ரு வழிபாடு', color: 'brown' },
  auspicious: { name: 'Auspicious Days', tamil: 'நல்ல நாட்கள்', color: 'emerald' },
  month_start: { name: 'Month Beginning', tamil: 'மாத தொடக்கம்', color: 'slate' },
  national: { name: 'National Holidays', tamil: 'தேசிய விடுமுறைகள்', color: 'pink' }
};