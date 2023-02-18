import { InjectionToken } from "@angular/core";
import { ICalendarTranslations } from "../models/interfaces";

export const TRANSLATIONS = new InjectionToken<ICalendarTranslations>('Calendar translations');
