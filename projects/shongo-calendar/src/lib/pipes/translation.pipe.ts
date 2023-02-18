import { Inject, Pipe } from "@angular/core";
import { InvalidTranslationKeyError } from "../errors";
import { ICalendarTranslations } from "../models/interfaces";
import { TRANSLATIONS } from "../translations";

@Pipe({
    name: 'translate',
    pure: true
})
export class TranslationPipe {
    constructor(@Inject(TRANSLATIONS) private _translations: ICalendarTranslations) {}

    transform(key: keyof ICalendarTranslations): string {
        const translation = this._translations[key];

        if (!translation) {
            throw new InvalidTranslationKeyError(key);
        }

        return translation;
    }
}