import { Inject, Optional, Pipe, PipeTransform } from '@angular/core';
import { InvalidTranslationKeyError } from '../errors';
import { ICalendarI18n, ICalendarTranslations } from '../models/interfaces';
import { SHONGO_CALENDAR_I18N } from '../translations';
import { SHONGO_CALENDAR_DYNAMIC_I18N } from '../translations/calendar-i18n.token';
@Pipe({
  name: 'translate',
  pure: true,
})
export class TranslationPipe implements PipeTransform {
  constructor(
    @Optional()
    @Inject(SHONGO_CALENDAR_DYNAMIC_I18N)
    private _i18n: ICalendarI18n,
    @Inject(SHONGO_CALENDAR_I18N)
    private _translations: ICalendarTranslations
  ) {}

  transform(key: keyof ICalendarTranslations): string {
    const trasnlations = this._i18n?.getTranslations() ?? this._translations;
    const translation = trasnlations[key];

    if (!translation) {
      throw new InvalidTranslationKeyError(key);
    }

    return translation;
  }
}
