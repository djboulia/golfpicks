import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";

import { EventService } from 'src/app/shared/services/backend/event.service';
import { DateFormatterService } from 'src/app/shared/services/date/date-formatter.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  events: any = null;

  baseUrl = '/component/event';

  errorMessage: any = null;
  isLoaded = false;

  constructor(
    private spinner: NgxSpinnerService,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService) { }

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
          self.error( "Error loading tournaments!");
        }
      });
  }

  private loading() {
    this.errorMessage = null;
    this.spinner.show();
    this.isLoaded = false;
  }

  private error(msg: string) {
    console.log(msg);

    this.errorMessage = msg;
    this.spinner.hide();
    this.isLoaded = false;
  }

  private loaded() {
    this.spinner.hide();
    this.isLoaded = true;
  }

}
