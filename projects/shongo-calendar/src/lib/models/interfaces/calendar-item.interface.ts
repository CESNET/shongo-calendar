import { IInterval } from "./interval.interface";
import { IOwner } from "./owner.interface";

export interface ICalendarItem {
    slot: IInterval;
    owner: IOwner;
    title: string;
}