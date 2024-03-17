import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { EventService } from '../../../shared/services/backend/event.service';

@Component({
  selector: 'app-eventleaders',
  templateUrl: './eventleaders.component.html',
  styleUrls: ['./eventleaders.component.scss'],
})
export class EventLeadersComponent extends BaseLoadingComponent implements OnInit {
  id: string | null = null;
  event: any = null;

  eventUrl = '/component/event';

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private eventApi: EventService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    this.loading();

    if (this.id) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      // go get this user's record
      this.eventApi.leaders(this.id).subscribe({
        next(data) {
          console.log('data ', data);

          if (!data) {
            self.error('Error loading scores!');
          } else {
            self.event = data;

            self.loaded();
          }
        },
        error(msg) {
          console.log('error loading scores!! ', msg);

          self.error('Error loading scores!');
        },
      });
    } else {
      this.error('Error loading scores!');
    }
  }
}
