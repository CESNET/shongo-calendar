import { IEventOwner } from './event-owner.interface';
import { IInterval } from './interval.interface';
import { IReservationResource } from './reservation-resource.interface';

export interface ICalendarItem {
  slot: IInterval;
  owner: IEventOwner;
  title: string;
  resource?: IReservationResource;
  data?: Record<string, unknown>;
}
