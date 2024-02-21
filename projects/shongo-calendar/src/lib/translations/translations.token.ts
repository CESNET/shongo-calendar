import { InjectionToken } from '@angular/core';
import { ICalendarTranslations } from '../models/interfaces';

export const SHONGO_CALENDAR_I18N = new InjectionToken<ICalendarTranslations>(
  'Shongo calendar i18n'
);
