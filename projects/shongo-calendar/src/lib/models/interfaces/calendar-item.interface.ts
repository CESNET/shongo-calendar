import { IEventOwner } from './event-owner.interface';
import { IInterval } from './interval.interface';

export interface ICalendarItem {
  slot: IInterval;
  owner: IEventOwner;
  title: string;
  data?: Record<string, unknown>;
}
