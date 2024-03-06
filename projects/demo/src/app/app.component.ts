import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ICalendarItem,
  IEventOwner,
  IInterval,
} from '@michaldrobnak/shongo-calendar';
import { CalendarView } from 'angular-calendar';
import moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  viewDate = new Date();
  view: CalendarView = CalendarView.Month;

  currentUser: IEventOwner = {
    name: 'John Doe',
    email: 'john.doe@gmail.com',
  };

  items: ICalendarItem[] = [
    {
      slot: { start: new Date(), end: moment().add(1, 'hour').toDate() },
      owner: this.currentUser,
      title: 'Meeting room reservation',
      resource: {
        id: '1',
        name: 'Meeting room 1',
      },
    },
  ];

  readonly CalendarView = CalendarView;

  onSlotSelected(slot: IInterval | null): void {
    console.log(`Slot selected:`, slot);
  }

  onLoadData(interval: IInterval): void {
    console.log(`Load data for interval:`, interval);
  }

  onItemClick(item: ICalendarItem): void {
    console.log(`Item clicked:`, item);
  }

  onViewDateChange(date: Date): void {
    this.viewDate = date;
  }

  onViewSelect(view: CalendarView): void {
    this.view = view;
  }
}
