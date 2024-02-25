import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { Event } from '../../../shared/services/backend/event.interfaces';
import { EventService } from '../../../shared/services/backend/event.service';
import { DateFormatterService } from '../../../shared/services/date/date-formatter.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent extends BaseLoadingComponent implements OnInit {
  events: Event[] = [];

  baseUrl = '/component/event';

  constructor(
    private spinner: NgxSpinnerService,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    const self = this;

    this.loading();

    this.eventApi.getAll().subscribe({
      next(data) {
        console.log('data ', data);

        data.sort(function (a: any, b: any) {
          if (a.start == b.start) {
            return 0;
          } else {
            return a.start > b.start ? -1 : 1;
          }
        });

        self.events = data;
        self.loaded();
      },
      error(msg) {
        console.log('error getting tournaments!! ', msg);
        self.error('Error loading tournaments!');
      },
    });
  }
}
