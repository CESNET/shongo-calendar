import { InjectionToken } from '@angular/core';
import { ICalendarI18n } from '../models/interfaces';

export const SHONGO_CALENDAR_DYNAMIC_I18N = new InjectionToken<ICalendarI18n>(
  'Shongo calendar i18n dynamic provider'
);
