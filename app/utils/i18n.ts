import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '../locales/en.json';
import es from '../locales/es.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Detect device locale only
      const locales = getLocales();
      const deviceLanguage = locales[0]?.languageCode || 'en';
      
      // Check if we support the detected language
      const supportedLanguages = ['en', 'es'];
      const detectedLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      
      callback(detectedLanguage);
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('en'); // Default to English
    }
  },
  init: () => {},
  cacheUserLanguage: () => {}
};

i18n
  .use(LANGUAGE_DETECTOR as any)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    debug: __DEV__,
    
    resources: {
      en: {
        translation: en
      },
      es: {
        translation: es
      }
    },
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;