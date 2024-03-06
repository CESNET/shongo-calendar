import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { WeekViewHourSegment } from 'calendar-utils';
import moment from 'moment';
import { BehaviorSubject, Observable, Subject, fromEvent } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { COLORS } from '../../data';
import { ICalendarItem, IEventOwner, IInterval } from '../../models/interfaces';
import { TShongoCalendarEvent, TWeekStart } from '../../models/types';
import { TranslationPipe } from '../../pipes/translation.pipe';
import { ceilToNearest } from '../../utils/ceil-to-nearest.util';
import { floorToNearest } from '../../utils/floor-to-nearest.util';

const DEFAULT_HOUR_SEGMENT_HEIGHT = 30;
const MOBILE_HOUR_SEGMENT_HEIGHT = 40;

/**
 * Calendar component that displays events and allows creating new ones.
 * Customized specificaly for Shongo.
 *
 * @author Michal Drobňák
 */
@Component({
  selector: 'shongo-calendar',
  templateUrl: './shongo-calendar.component.html',
  styleUrls: ['./shongo-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ShongoCalendarComponent implements OnInit, OnChanges {
  /**
   * Emits selected slot on drag selection.
   */
  @Output() slotSelected = new EventEmitter<IInterval | null>();

  /**
   * Emits event when view interval changes and needs to be re-fetched.
   */
  @Output() loadData = new EventEmitter<IInterval>();

  /**
   * Emits calendar event when user clicks on it.
   */
  @Output() itemClicked = new EventEmitter<ICalendarItem>();

  /**
   * Two way binding of view.
   */
  @Output() viewChange = new EventEmitter<CalendarView>();

  /**
   * Two way binding of view date.
   */
  @Output() viewDateChange = new EventEmitter<Date>();

  /**
   * Allows selecting time slots in calendar.
   *
   * @default false
   */
  @Input() allowSlotSelection = false;

  /**
   * Displays loading spinner.
   *
   * @default false
   */
  @Input() loading = false;

  /**
   * Current user that is creating reservations.
   */
  @Input() currentUser?: IEventOwner;

  /**
   * Will style calendar for mobile devices.
   */
  @Input() mobileDevice = false;

  /**
   * Whether to fill the whole container with the calendar.
   * Makes sense only for the month view.
   *
   * @default true
   */
  @Input() fill = true;

  /**
   * If true, calendar will highlight all reservations that belong to the current user.
   */
  @Input()
  get highlightUsersReservations(): boolean {
    return this._highlightUsersReservations;
  }
  set highlightUsersReservations(value: boolean) {
    this._highlightUsersReservations = value;
    this._onHighlightChange();
  }

  /**
   * Currently displayed date.
   */
  @Input()
  get viewDate(): Date {
    return this._viewDate;
  }
  set viewDate(value: Date) {
    this._viewDate = value;
    this._handleViewOrDateChange();
    this._cd.markForCheck();
  }

  /**
   * Current calendar view (day, week, month).
   */
  @Input()
  get view(): CalendarView {
    return this._view;
  }
  set view(value: CalendarView) {
    this._view = value;
    this._handleViewOrDateChange();
    this._cd.markForCheck();
  }

  /**
   * Calendar items to display.
   */
  @Input()
  get items(): ICalendarItem[] {
    return this._items;
  }
  set items(items: ICalendarItem[]) {
    this._items = items;
    this._events = this._createEvents(items);

    if (this._createdEvent) {
      this._events.push(this._createdEvent);
    }
  }

  /**
   * Used to refresh calendar when items change. Used as an input to angular-calendar views.
   */
  readonly refresh$ = new Subject<void>();

  /**
   * Emits true while user is dragging to create an event.
   */
  readonly isDragging$ = new BehaviorSubject(false);

  /**
   * Defines start of the week in the week and month views. 0 = Sunday, 1 = Monday, etc.
   */
  readonly weekStartsOn: TWeekStart = 0;

  /**
   * Height of one hour segment in pixels.
   */
  protected hourSegmentHeight = 30;

  /**
   * Items coming from the parent app.
   */
  private _items: ICalendarItem[] = [];

  /**
   * Calendar events from angular-calendar (they wrap calendar items).
   */
  private _events: TShongoCalendarEvent[] = [];

  /**
   * Event that is created when user selects a time slot.
   */
  private _createdEvent?: TShongoCalendarEvent;

  /**
   * If true, calendar will highlight all reservations that belong to the current user.
   */
  private _highlightUsersReservations = false;

  /**
   * Current calendar view (day, week, month).
   */
  private _view = CalendarView.Month;

  /**
   * Interval of the last fetched data.
   */
  private _lastFetchedInterval?: IInterval;

  /**
   * Currently displayed date.
   */
  private _viewDate = moment().toDate();

  readonly CalendarView = CalendarView;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private _cd: ChangeDetectorRef,
    private _translate: TranslationPipe
  ) {}

  ngOnInit(): void {
    this._handleViewOrDateChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mobileDevice']) {
      this.hourSegmentHeight = this.mobileDevice
        ? MOBILE_HOUR_SEGMENT_HEIGHT
        : DEFAULT_HOUR_SEGMENT_HEIGHT;
    }
  }

  /**
   * Currently selected time slot.
   */
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
    this._refreshCalendar();
  }

  /**
   * Changes view to day and selects a given date.
   * Used for date navigation from week or month view.
   *
   * @param date Clicked date.
   * @fires viewChange
   * @fires viewDateChange
   */
  selectDate(date: Date): void {
    this._viewDate = date;
    this._view = CalendarView.Day;

    this.viewChange.emit(this._view);
    this.viewDateChange.emit(this._viewDate);

    this._handleViewOrDateChange();
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
    this.isDragging$.next(true);

    this._createdEvent = this._createSelectedSlotEvent(segment.date);

    this._events = this._events
      .filter((event) => event !== prevCreatedEvent)
      .concat([this._createdEvent]);

    const segmentPosition = segmentElement.getBoundingClientRect();

    (fromEvent(document, 'mousemove') as Observable<MouseEvent>)
      .pipe(
        finalize(() => {
          this.slotSelected.emit(this.selectedSlot);
          this.isDragging$.next(false);
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
          this._createdEvent!.title = this._buildSelectedSlotTitle(
            this._createdEvent!.start,
            newEnd!
          );
          this._refreshCalendar();
        }
      });
  }

  /**
   * Gets event's slot as formatted readable string.
   *
   * @param event Calendar event.
   * @returns Formatted slot string.
   */
  getSlotString(event: TShongoCalendarEvent): string {
    if (event.end) {
      return `${moment(event.start).format('LLL')} - ${moment(event.end).format(
        'LLL'
      )}`;
    }
    return moment(event.start).format('LLL');
  }

  /**
   * Handles event resizing - moving the start or end of an event.
   * Emits selected slot on change.
   *
   * @param eventTimesChangedEvent Calendar event times changed event.
   */
  eventTimesChanged(
    eventTimesChangedEvent: CalendarEventTimesChangedEvent
  ): void {
    const { event, newStart, newEnd } = eventTimesChangedEvent;

    event.start = newStart;
    event.end = newEnd;
    event.title = this._buildSelectedSlotTitle(newStart, newEnd!);

    this.slotSelected.emit(this.selectedSlot);
    this._refreshCalendar();
  }

  /**
   * Clears selected slot.
   */
  clearSelectedSlot(): void {
    this._events = this._events.filter((event) => event !== this._createdEvent);
    this._createdEvent = undefined;
    this.slotSelected.emit(null);
  }

  /**
   * Emits calendar item on event click.
   *
   * @param event Calendar event.
   */
  handleEventClick(event: TShongoCalendarEvent): void {
    if (event.meta?.calendarItem) {
      this.itemClicked.emit(event.meta.calendarItem);
    }
  }

  getCalendarEvents(): TShongoCalendarEvent[] {
    return this._events;
  }

  getOwner(event: CalendarEvent): IEventOwner | undefined {
    return event.meta?.calendarItem?.owner;
  }

  /**
   * Checks if new displayed interval is a sub-interval of previously
   * fetched interval and requests new data if needed.
   */
  private _handleViewOrDateChange(): void {
    const interval = this._getViewInterval(this.viewDate);

    if (
      !this._lastFetchedInterval ||
      !this._isSubInterval(this._lastFetchedInterval, interval)
    ) {
      this._requestData();
    }
  }

  /**
   * Checks if interval is a sub-interval of another interval.
   *
   * @param superInterval Super interval.
   * @param subInterval Sub interval.
   * @returns True if interval is a sub-interval of super interval.
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

  /**
   * Calculates the interval of the current view based on the view date.
   *
   * @param viewDate View date.
   * @returns View interval.
   */
  private _getViewInterval(viewDate: Date): IInterval {
    let intervalFrom: Date;
    let intervalTo: Date;

    if (this.view === CalendarView.Day) {
      intervalFrom = moment(viewDate).startOf('day').toDate();
      intervalTo = moment(viewDate).endOf('day').toDate();
    } else if (this.view === CalendarView.Week) {
      intervalFrom = moment(viewDate).startOf('week').toDate();
      intervalTo = moment(viewDate).endOf('week').toDate();
    } else {
      intervalFrom = moment(viewDate).startOf('month').startOf('week').toDate();
      intervalTo = moment(viewDate).endOf('month').endOf('week').toDate();
    }

    return { start: intervalFrom, end: intervalTo };
  }

  private _getDisplayedInterval(): IInterval {
    return this._getViewInterval(this.viewDate);
  }

  /**
   * Creates calendar events from calendar items.
   *
   * @param calendarItems Calendar items.
   * @returns Array of calendar events.
   */
  private _createEvents(
    calendarItems: ICalendarItem[]
  ): TShongoCalendarEvent[] {
    const events = calendarItems.map((item) => this._createEvent(item));

    return this._highlightEvents(
      events,
      this.highlightUsersReservations ?? false
    );
  }

  /**
   * Crates a calendar event from calendar item.
   *
   * @param calendarItem Calendar item.
   * @returns Calendar event.
   */
  private _createEvent(calendarItem: ICalendarItem): TShongoCalendarEvent {
    return {
      start: moment(calendarItem.slot.start).toDate(),
      end: moment(calendarItem.slot.end).toDate(),
      title: calendarItem.title,
      meta: {
        calendarItem,
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
  private _createSelectedSlotEvent(
    start: Date,
    end?: Date
  ): TShongoCalendarEvent {
    if (!end) {
      end = moment(start).add(30, 'minutes').toDate();
    }

    return {
      id: this._events.length,
      title: this._buildSelectedSlotTitle(start, end),
      start,
      end,
      color: COLORS.created,
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
    this._refreshCalendar();
  }

  /**
   * Highlights or unhighlights calendar events based on highlighting state.
   *
   * @param events Array of calendar events.
   * @param highlightMine Whether user's events should be highlighted.
   * @returns Calendar events.
   */
  private _highlightEvents(
    events: TShongoCalendarEvent[],
    highlightMine: boolean
  ): TShongoCalendarEvent[] {
    let highlightedEvents: TShongoCalendarEvent[];

    if (highlightMine && this.currentUser) {
      const { name, email } = this.currentUser;

      highlightedEvents = events.map((event) => {
        const calendarItem = event.meta?.calendarItem;

        if (
          calendarItem &&
          calendarItem.owner.email === email &&
          calendarItem.owner.name === name
        ) {
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

  /**
   * Requests data for the current view interval.
   */
  private _requestData(): void {
    const displayedInterval = this._getDisplayedInterval();

    this.loadData.emit(displayedInterval);
    this._lastFetchedInterval = displayedInterval;
  }

  /**
   * Refreshes underlying calendar.
   */
  private _refreshCalendar(): void {
    this.refresh$.next();
  }

  private _buildSelectedSlotTitle(start: Date, end: Date): string {
    return `${this._translate.transform('reservationFor')} ${moment(
      start
    ).format('LT')} - ${moment(end).format('LT')}`;
  }
}