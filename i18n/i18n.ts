import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import nl from './nl.ts';
import fr from './fr.ts';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: nl },
      fr: { translation: fr }
    },
    lng: 'nl', // Default language
    fallbackLng: 'nl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;