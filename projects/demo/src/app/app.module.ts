import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ShongoCalendarModule } from 'projects/shongo-calendar/src/public-api';

import { AppComponent } from './app.component';
import * as moment from 'moment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ShongoCalendarModule.forRoot({ moment })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
