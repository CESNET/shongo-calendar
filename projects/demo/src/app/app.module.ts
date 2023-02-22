import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ShongoCalendarModule } from '@michaldrobnak/shongo-calendar';
import { MOMENT } from 'angular-calendar';
import moment from 'moment';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ShongoCalendarModule.forRoot()],
  providers: [
    {
      provide: MOMENT,
      useValue: moment,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
