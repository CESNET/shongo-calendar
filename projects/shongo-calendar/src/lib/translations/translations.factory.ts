import { ICalendarTranslations } from '../models/interfaces';
import { DEFAULT_TRANSLATIONS } from './translations.default';

export const translationsFactory = (translations?: ICalendarTranslations) => {
  return translations ? translations : DEFAULT_TRANSLATIONS;
};
