import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import guTranslations from './locales/gu.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      gu: { translation: guTranslations },
    },
    lng: 'en', // default
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already escapes values
    },
  });

export default i18n;
