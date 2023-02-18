import { ModuleWithProviders, NgModule } from '@angular/core';
import {CommonModule } from '@angular/common';
import { ShongoCalendarComponent } from './shongo-calendar.component';
import { CalendarDateFormatter, CalendarModule, CalendarMomentDateFormatter, DateAdapter, MOMENT } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import { ICalendarTranslations } from './models/interfaces';
import { TRANSLATIONS } from './translations';
import { translationsFactory } from './translations';
import { TranslationPipe } from './pipes/translation.pipe';
import * as moment from 'moment';

function momentAdapterFactory() {
  return adapterFactory(moment);
}

interface IShongoCalendarModuleConfig {
  moment: typeof moment;
  translations?: ICalendarTranslations;
}

@NgModule({
  declarations: [
    ShongoCalendarComponent,
    TranslationPipe
  ],
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
  exports: [
    ShongoCalendarComponent
  ],
  providers: [TranslationPipe]
})
export class ShongoCalendarModule {
  static forRoot(config: IShongoCalendarModuleConfig): ModuleWithProviders<ShongoCalendarModule> {
    return {
      ngModule: ShongoCalendarModule,
      providers: [
        { provide: TRANSLATIONS, useFactory: () => translationsFactory(config.translations) },
        {
          provide: MOMENT,
          useValue: config.moment,
        },
      ]
    }
  }
}
