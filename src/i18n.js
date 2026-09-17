import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslation from './locales/ar.json';
import enTranslation from './locales/en.json';

const savedLanguage = localStorage.getItem('app_language') || 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: arTranslation },
    en: { translation: enTranslation },
  },
  lng: savedLanguage,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

export const changeAppLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('app_language', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// Set initial document attributes
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

export default i18n;
