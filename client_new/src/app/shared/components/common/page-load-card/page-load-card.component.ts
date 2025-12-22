import { Component, Input } from '@angular/core';
import { AlertComponent } from '../../ui/alert/alert.component';
import { LoaderService } from '../../../services/loader.service';
import { PageLoadComponent } from '../page-load/page-load.component';

/**
 *
 * handle the display of a loading indicator when the page is loading, an error message
 * if there was an error, or the page content when loaded
 *
 */
@Component({
  selector: 'app-page-load-card',
  imports: [AlertComponent, PageLoadComponent],
  templateUrl: './page-load-card.component.html',
  styles: ``,
})
export class PageLoadCardComponent {
  @Input() pageTitle = '';
  @Input() loader: LoaderService | undefined = undefined;
}
