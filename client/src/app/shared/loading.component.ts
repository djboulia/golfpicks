import {
  Component,
  Input,
  OnDestroy,
  Inject,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `<div class="preloader">
        <div class="spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class LoadingComponent implements OnDestroy {

  @Input()
  public backgroundColor = 'rgba(0, 115, 170, 0.69)';

  constructor(
  ) {}

  ngOnDestroy(): void {
  }
}
