import { Component, OnInit } from '@angular/core';
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
    private eventApi: EventService,
    public dateFormatter: DateFormatterService) { }

  ngOnInit(): void {
    const self = this;

    this.errorMessage = null;

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
          self.isLoaded = true;
        },
        error(msg) {
          console.log('error getting tournaments!! ', msg);
          self.errorMessage = "Error loading tournaments!";
          self.isLoaded = false;
        }
      });
  }
}
