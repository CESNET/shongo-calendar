import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MOMENT } from 'angular-calendar';
import * as moment from 'moment';
import {
  CalendarView,
  ShongoCalendarComponent,
  ShongoCalendarModule,
} from 'projects/shongo-calendar/src/public-api';

const HOUR_SEGMENT_SELECTOR = 'div.cal-hour-segment';

describe('Shongo calendar test', () => {
  let component: ShongoCalendarComponent;
  let fixture: ComponentFixture<ShongoCalendarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShongoCalendarComponent],
      imports: [ShongoCalendarModule.forRoot()],
      providers: [
        {
          provide: MOMENT,
          useValue: moment,
        },
      ],
    });
    fixture = TestBed.createComponent(ShongoCalendarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('Slot selection [day view]', () => {
    let hourSegments: HTMLElement[];

    beforeEach(() => {
      component.view = CalendarView.Day;
      component.allowSlotSelection = true;

      hourSegments = fixture.nativeElement.querySelectorAll(
        HOUR_SEGMENT_SELECTOR
      );
    });

    xit('should emit selected interval on click', () => {
      spyOn(component.slotSelected, 'emit');

      const randomSegment = pickRandom(Array.from(hourSegments));
      randomSegment.click();

      expect(component.slotSelected.emit).toHaveBeenCalled();
    });
  });
});

const pickRandom = <T>(array: T[]) => {
  return array[Math.round(Math.random() * (array.length - 1))];
};
