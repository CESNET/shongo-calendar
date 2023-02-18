import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { WeekViewHourSegment } from 'calendar-utils';
import * as moment from 'moment';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ICalendarItem, IInterval, IOwner } from './models/interfaces';
import { ICalendarTranslations } from './models/interfaces/calendar-translations.interface';
import { TranslationPipe } from './pipes/translation.pipe';

type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function floorToNearest(amount: number, precision: number) {
  return Math.floor(amount / precision) * precision;
}

function ceilToNearest(amount: number, precision: number) {
  return Math.ceil(amount / precision) * precision;
}

const COLORS = {
  owned: {
    primary: '#f26161',
    secondary: '#ffb0b0',
  },
  created: {
    primary: '#84db87',
    secondary: '#cfffd1',
  },
  default: {
    primary: '#6daded',
    secondary: '#c9e4ff',
  },
};

@Component({
  selector: 'shongo-calendar',
  templateUrl: './shongo-calendar.component.html',
  styleUrls: ['./shongo-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('loading', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 })),
      ]),
      transition(':leave', animate('200ms ease', style({ opacity: 0 }))),
    ]),
  ],
})
export class ShongoCalendarComponent implements OnInit {
  @Output() slotSelected = new EventEmitter<IInterval | null>();
  @Output() loadData = new EventEmitter<IInterval>();
  @Output() eventClicked = new EventEmitter<CalendarEvent>();

  /**
   * Allows selecting time slots in calendar (default = false).
   */
  @Input() allowSlotSelection = false;
  @Input() loading = false;
  @Input() translations?: ICalendarTranslations;
  @Input() owner?: IOwner;

  /**
   * If true, calendar will highlight all reservations that belong to the current user.
   */
  @Input() set highlightUsersReservations(value: boolean) {
    this._highlightUsersReservations = value;
    this._onHighlightChange();
  }
  get highlightUsersReservations(): boolean {
    return this._highlightUsersReservations;
  }

  /**
   * Currently displayed date.
   */
  @Input() set viewDate(value: Date) {
    this._viewDate = value;
    this.handleViewOrDateChange();
    this._cd.detectChanges();
  }
  get viewDate(): Date {
    return this._viewDate;
  }

  /**
   * Current calendar view (day, week, month).
   */
  @Input() set view(value: CalendarView) {
    this._view = value;
    this.handleViewOrDateChange();
    this._cd.detectChanges();
  }
  get view(): CalendarView {
    return this._view;
  }

  get displayedInterval(): IInterval {
    return this._getInterval(this.viewDate);
  }

  readonly refresh$ = new Subject<void>();
  readonly weekStartsOn: WeekStartsOn = 0;
  readonly CalendarView = CalendarView;

  private _events: CalendarEvent[] = [];
  private _createdEvent?: CalendarEvent;
  private _highlightUsersReservations = false;
  private _viewDate = moment().toDate();
  private _view = CalendarView.Month;
  private _lastFetchedInterval?: IInterval;

  private readonly _loading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private _cd: ChangeDetectorRef,
    private _translate: TranslationPipe
  ) {}

  ngOnInit(): void {
    this._requestData();
  }

  get events(): CalendarEvent[] {
    return this._events;
  }

  get selectedSlot(): IInterval | undefined {
    if (this._createdEvent && this._createdEvent.end) {
      return { start: this._createdEvent.start, end: this._createdEvent.end };
    }
    return undefined;
  }

  set selectedSlot(slot: IInterval | undefined) {
    if (!slot) {
      this._events = this._events.filter((evt) => evt !== this._createdEvent);
    } else if (this._createdEvent) {
      this._createdEvent.start = slot.start;
      this._createdEvent.end = slot.end;
    } else {
      this._createdEvent = this._createSelectedSlotEvent(slot.start, slot.end);
      this._events.push(this._createdEvent);
    }

    this.refresh$.next();
  }

  /**
   * Fetches reservations on view or date change.
   *
   * Checks if new displayed interval is a sub-interval of previously
   * fetched interval and only re-fetches if not.
   */
  handleViewOrDateChange(): void {
    const interval = this._getInterval(this.viewDate);

    if (
      !this._lastFetchedInterval ||
      !this._isSubInterval(this._lastFetchedInterval, interval)
    ) {
      this._requestData();
    }
  }

  /**
   * Refreshes data.
   */
  refresh(): void {
    this._loading$.next(true);
    setTimeout(() => this._requestData(), 200);
  }

  /**
   * Opens date on click.
   *
   * @param date Clicked date.
   */
  openDate(date: Date): void {
    this._viewDate = date;
    this._view = CalendarView.Day;
    this.handleViewOrDateChange();
    this._cd.detectChanges();
  }

  /**
   * Starts event creation by dragging.
   *
   * @param segment Drag start segment.
   * @param segmentElement Drag start segment element.
   */
  startDragToCreate(segment: WeekViewHourSegment, segmentElement: HTMLElement) {
    const prevCreatedEvent = this._createdEvent;
    this._createdEvent = this._createSelectedSlotEvent(segment.date);

    this._events = this._events
      .filter((event) => event !== prevCreatedEvent)
      .concat([this._createdEvent]);
    this.slotSelected.emit(this.selectedSlot);

    const segmentPosition = segmentElement.getBoundingClientRect();

    (fromEvent(document, 'mousemove') as Observable<MouseEvent>)
      .pipe(
        finalize(() => {
          delete this._createdEvent!.meta.tmpEvent;
          this.refresh$.next();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        const minutesDiff = ceilToNearest(
          mouseMoveEvent.clientY - segmentPosition.top,
          30
        );

        const daysDiff =
          floorToNearest(
            mouseMoveEvent.clientX - segmentPosition.left,
            segmentPosition.width
          ) / segmentPosition.width;

        const newEnd = moment(segment.date)
          .add(minutesDiff, 'minute')
          .add(daysDiff, 'day')
          .toDate();

        if (newEnd > segment.date) {
          this._createdEvent!.end = newEnd;
        }
        this.refresh$.next();
        this.slotSelected.emit(this.selectedSlot);
      });
  }

  /**
   * Gets event's slot as formatted readable string.
   *
   * @param event Calendar event.
   * @returns Formatted slot string.
   */
  getSlotString(event: CalendarEvent): string {
    if (event.end) {
      return `${moment(event.start).format('LLL')} - ${moment(event.end).format(
        'LLL'
      )}`;
    }
    return moment(event.start).format('LLL');
  }

  /**
   * Changes event times on valid event time change event.
   *
   * @param eventTimesChangedEvent Calendar event times changed event.
   */
  eventTimesChanged(
    eventTimesChangedEvent: CalendarEventTimesChangedEvent
  ): void {
    const { event, newStart, newEnd } = eventTimesChangedEvent;
    event.start = newStart;
    event.end = newEnd;
    this.refresh$.next();
    this.slotSelected.emit(this.selectedSlot);
  }

  /**
   * Clears selected slot.
   */
  clearSelectedSlot(): void {
    this._events = this._events.filter((event) => event !== this._createdEvent);
    this._createdEvent = undefined;
    this.slotSelected.emit(null);
    this.refresh$.next();
  }

  /**
   * If clicked event is awaiting confirmation and logged in user has
   * a permission to confirm this request, opens an event confirmation dialog.
   *
   * @param event
   */
  handleEventClick(event: CalendarEvent): void {
    this.eventClicked.emit(event);
  }

  /**
   * Checks if interval is a sub-interval of another interval.
   *
   * @param superInterval Super interval.
   * @param subInterval Sub interval.
   * @returns True if interval is a sub-interval of super interval, else false.
   */
  private _isSubInterval(
    superInterval: IInterval,
    subInterval: IInterval
  ): boolean {
    return (
      subInterval.start >= superInterval.start &&
      subInterval.end <= superInterval.end
    );
  }

  private _getInterval(viewDate: Date): IInterval {
    let intervalFrom: Date;
    let intervalTo: Date;

    if (this.view === CalendarView.Day) {
      intervalFrom = moment(viewDate).startOf('day').toDate();
      intervalTo = moment(viewDate).endOf('day').toDate();
    } else if (this.view === CalendarView.Week) {
      intervalFrom = moment(viewDate).startOf('week').toDate();
      intervalTo = moment(viewDate).endOf('week').toDate();
    } else {
      const monthStart = moment(viewDate).startOf('month').toDate();
      const monthEnd = moment(viewDate).endOf('month').toDate();

      // If date is sunday return start of date, else return start of last sunday (month view starts on sunday).
      const intervalFromDay = moment(monthStart).day();
      intervalFrom =
        intervalFromDay === 7
          ? moment(monthStart).startOf('day').toDate()
          : moment(monthStart)
              .subtract(intervalFromDay, 'day')
              .startOf('day')
              .toDate();

      // If date is saturday return end saturday, else return end of next saturday (month view ends on saturday).
      const indervalToDay = moment(monthEnd).day();
      intervalTo =
        indervalToDay === 6
          ? moment(monthEnd).endOf('day').toDate()
          : moment(monthEnd)
              .add(6 - indervalToDay, 'day')
              .endOf('day')
              .toDate();
    }

    return { start: intervalFrom, end: intervalTo };
  }

  /**
   * Checks if interval has no intersection with any calendar event.
   *
   * @param start Interval start.
   * @param end Interval end.
   * @returns True if interval has no intersection, else false.
   */
  private _hasNoIntersection(start: Date, end: Date): boolean {
    return this._events.every(
      (event) =>
        event === this._createdEvent ||
        (event.end && event.end <= start) ||
        event.start >= end
    );
  }

  /**
   * Creates calendar events from reservation requests.
   *
   * @param calendarItems Calendar items.
   * @returns Array of calendar events.
   */
  private _createEvents(calendarItems: ICalendarItem[]): CalendarEvent[] {
    const events = calendarItems.map((item) => this._createEvent(item));

    return this._highlightEvents(
      events,
      this.highlightUsersReservations ?? false
    );
  }

  /**
   * Crates a calendar event from reservation request.
   *
   * @param reservationRequest Reservation request.
   * @returns Calendar event.
   */
  private _createEvent(calendarItem: ICalendarItem): CalendarEvent {
    return {
      start: moment(calendarItem.slot.start).toDate(),
      end: moment(calendarItem.slot.end).toDate(),
      title: calendarItem.title,
      meta: {
        owner: calendarItem.owner,
      },
    };
  }

  /**
   * Creates selected slot calendar event.
   *
   * @param start Slot start.
   * @param end Slot end.
   * @returns Calendar event.
   */
  private _createSelectedSlotEvent(start: Date, end?: Date): CalendarEvent {
    return {
      id: this._events.length,
      title: this._translate.transform('selectedTimeSlotTitle'),
      start,
      end: end ?? moment(start).add(30, 'minutes').toDate(),
      color: COLORS.created,
      meta: {
        tmpEvent: true,
        owner: this.owner,
      },
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      draggable: true,
    };
  }

  /**
   * Handles event highlighting state change. Highlights events based on this state.
   */
  private _onHighlightChange(): void {
    this._events = this._highlightEvents(
      this._events,
      this._highlightUsersReservations
    );
    this.refresh$.next();
  }

  /**
   * Highlights or unhighlights calendar events based on highlighting state.
   *
   * @param events Array of calendar events.
   * @param highlightMine Whether user's events should be highlighted.
   * @returns Calendar events.
   */
  private _highlightEvents(
    events: CalendarEvent[],
    highlightMine: boolean
  ): CalendarEvent[] {
    let highlightedEvents: CalendarEvent[];

    if (highlightMine && this.owner) {
      const { name, email } = this.owner;

      highlightedEvents = events.map((event) => {
        if (event.meta.ownerEmail === email && event.meta.owner === name) {
          event.color = COLORS.owned;
          event.cssClass = 'shongo-calendar__event--white';
        }
        return event;
      });
    } else {
      highlightedEvents = events.map((event) => {
        if (event === this._createdEvent) {
          event.color = COLORS.created;
        } else {
          event.color = COLORS.default;
        }
        event.cssClass = '';
        return event;
      });
    }

    return highlightedEvents;
  }

  private _requestData(): void {
    this.loadData.emit(this.displayedInterval);
  }
}
