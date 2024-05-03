import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { delay, first, fromEvent, merge, of, takeUntil } from 'rxjs';

const DEFAULT_DELAY = 200;

@Directive({
  selector: '[delayTouchStart]',
})
export class DelayTouchStartDirective {
  @Output() delayedTouchStart = new EventEmitter<TouchEvent>();
  @Input() delayTouchStart = DEFAULT_DELAY;

  constructor(private elementRef: ElementRef) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    const touchMove$ = fromEvent(this.elementRef.nativeElement, 'touchmove');
    const touchEnd$ = fromEvent(this.elementRef.nativeElement, 'touchend');
    const cancel$ = merge(touchMove$, touchEnd$).pipe(first());

    of(event)
      .pipe(delay(this.delayTouchStart), takeUntil(cancel$))
      .subscribe(() => {
        this.delayedTouchStart.emit(event);
      });
  }
}
