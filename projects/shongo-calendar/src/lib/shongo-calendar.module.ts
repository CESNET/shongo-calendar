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
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { ShongoCalendarComponent } from './components/shongo-calendar/shongo-calendar.component';
import { DelayTouchStartDirective } from './directives';
import { ICalendarTranslations } from './models/interfaces';
import { TranslationPipe } from './pipes/translation.pipe';
import { SHONGO_CALENDAR_I18N, translationsFactory } from './translations';

function momentAdapterFactory() {
  return adapterFactory(moment);
}

@NgModule({
  declarations: [
    ShongoCalendarComponent,
    TranslationPipe,
    LoadingOverlayComponent,
    DelayTouchStartDirective,
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
          provide: SHONGO_CALENDAR_I18N,
          useFactory: () => translationsFactory(translations),
        },
      ],
    };
  }
}
