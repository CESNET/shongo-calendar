import { Injectable, inject } from '@angular/core';
import { ICalendarTranslations } from '../models/interfaces';
import { SHONGO_CALENDAR_I18N } from '../translations';

@Injectable()
export class CalendarI18n {
  private _translations = inject(SHONGO_CALENDAR_I18N);

  getTranslations(): ICalendarTranslations {
    return this._translations;
  }
}
