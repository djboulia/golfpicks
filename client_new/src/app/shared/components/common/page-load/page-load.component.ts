import { Component, Input } from '@angular/core';
import { AlertComponent } from '../../ui/alert/alert.component';

@Component({
  selector: 'app-page-load',
  imports: [AlertComponent],
  templateUrl: './page-load.component.html',
  styles: ``,
})
export class PageLoadComponent {
  @Input() pageTitle = '';
  @Input() loading = false;
  @Input() errorMessage: string | null = null;
}
