import { Inject, Pipe, PipeTransform } from '@angular/core';
import { InvalidTranslationKeyError } from '../errors';
import { ICalendarTranslations } from '../models/interfaces';
import { SHONGO_CALENDAR_I18N } from '../translations';

@Pipe({
  name: 'translate',
  pure: true,
})
export class TranslationPipe implements PipeTransform {
  constructor(
    @Inject(SHONGO_CALENDAR_I18N)
    private _translations: ICalendarTranslations
  ) {}

  transform(key: keyof ICalendarTranslations): string {
    const translation = this._translations[key];

    if (!translation) {
      throw new InvalidTranslationKeyError(key);
    }

    return translation;
  }
}
