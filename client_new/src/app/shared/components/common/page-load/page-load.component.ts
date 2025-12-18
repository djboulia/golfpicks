import { Component, Input } from '@angular/core';
import { AlertComponent } from '../../ui/alert/alert.component';
import { LoaderService } from '../../../services/loader.service';

/**
 *
 * handle the display of a loading indicator when the page is loading, an error message
 * if there was an error, or the page content when loaded
 *
 */
@Component({
  selector: 'app-page-load',
  imports: [AlertComponent],
  templateUrl: './page-load.component.html',
  styles: ``,
})
export class PageLoadComponent {
  @Input() pageTitle = '';
  @Input() loader: LoaderService | undefined = undefined;
}
