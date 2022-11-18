import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";
import { BaseLoadingComponent } from '../../base.loading.component';

import { EventService } from 'src/app/shared/services/backend/event.service';
import { DateFormatterService } from 'src/app/shared/services/date/date-formatter.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent extends BaseLoadingComponent implements OnInit {

  events: any = null;

  baseUrl = '/component/event';

  constructor(
    private spinner: NgxSpinnerService,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    const self = this;

    this.loading();

    this.eventApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          data.sort(function (a: any, b: any) {
            if (a.attributes.start == b.attributes.start) {
              return 0;
            } else {
              return (a.attributes.start > b.attributes.start) ? -1 : 1;
            }
          });


          self.events = data;
          self.loaded();
        },
        error(msg) {
          console.log('error getting tournaments!! ', msg);
          self.error("Error loading tournaments!");
        }
      });
  }
}
