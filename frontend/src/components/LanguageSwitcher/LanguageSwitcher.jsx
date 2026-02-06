import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher = ({ className = '', variant = 'dropdown' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    // Store language preference in localStorage
    localStorage.setItem('i18nextLng', languageCode);
  };

  // Toggle variant - simple switch between two languages
  if (variant === 'toggle') {
    return (
      <button
        onClick={() => changeLanguage(i18n.language === 'en' ? 'ta' : 'en')}
        className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 ${className}`}
        title={t('languages.changeLanguage')}
      >
        <LanguageIcon className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
      </button>
    );
  }

  // Badge variant - simple display with click to change
  if (variant === 'badge') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-temple-100 text-temple-800 hover:bg-temple-200 focus:outline-none focus:ring-2 focus:ring-temple-500"
        >
          <LanguageIcon className="w-3 h-3 mr-1" />
          {currentLanguage.code.toUpperCase()}
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`block w-full text-left px-3 py-2 text-xs ${
                    language.code === i18n.language
                      ? 'bg-temple-100 text-temple-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {language.nativeName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <LanguageIcon className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline mr-2">{currentLanguage.nativeName}</span>
        <span className="sm:hidden mr-2">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                {t('languages.selectLanguage')}
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`block w-full text-left px-3 py-2 text-sm ${
                    language.code === i18n.language
                      ? 'bg-temple-100 text-temple-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{language.nativeName}</div>
                      <div className="text-xs text-gray-500">{language.name}</div>
                    </div>
                    {language.code === i18n.language && (
                      <div className="w-2 h-2 bg-temple-600 rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;