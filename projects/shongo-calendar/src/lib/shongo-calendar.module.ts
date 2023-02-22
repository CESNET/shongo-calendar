import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMomentDateFormatter,
  DateAdapter,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import moment from 'moment';
import { ICalendarTranslations } from './models/interfaces';
import { TranslationPipe } from './pipes/translation.pipe';
import { ShongoCalendarComponent } from './shongo-calendar.component';
import { TRANSLATIONS, translationsFactory } from './translations';

function momentAdapterFactory() {
  return adapterFactory(moment);
}

@NgModule({
  declarations: [ShongoCalendarComponent, TranslationPipe],
  imports: [
    CommonModule,
    CalendarModule.forRoot(
      {
        provide: DateAdapter,
        useFactory: momentAdapterFactory,
      },
      {
        dateFormatter: {
          provide: CalendarDateFormatter,
          useClass: CalendarMomentDateFormatter,
        },
      }
    ),
  ],
  exports: [ShongoCalendarComponent, CalendarModule],
  providers: [TranslationPipe],
})
export class ShongoCalendarModule {
  static forRoot(
    translations?: ICalendarTranslations
  ): ModuleWithProviders<ShongoCalendarModule> {
    return {
      ngModule: ShongoCalendarModule,
      providers: [
        {
          provide: TRANSLATIONS,
          useFactory: () => translationsFactory(translations),
        },
      ],
    };
  }
}
