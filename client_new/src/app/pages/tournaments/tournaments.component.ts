import { Component, OnInit } from '@angular/core';

import { Event } from '../../shared/services/golfpicks/event.model';
import { EventService } from '../../shared/services/golfpicks/event.service';
import { DateFormatterService } from '../../shared/services/date/date-formatter.service';
import { GAMEURLS } from '../../app.routes';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';

@Component({
  selector: 'app-events',
  templateUrl: './tournaments.component.html',
  imports: [PageLoadCardComponent],
})
export class TournamentsComponent implements OnInit {
  events: Event[] = [];

  baseUrl = GAMEURLS.tournamentOverview;

  constructor(
    private eventApi: EventService,
    public dateFormatter: DateFormatterService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.loader.setLoading(true);

    this.eventApi.getAll().subscribe({
      next: (data) => {
        console.log('data ', data);

        data.sort(function (a: any, b: any) {
          if (a.start == b.start) {
            return 0;
          } else {
            return a.start > b.start ? -1 : 1;
          }
        });

        this.events = data;
        this.loader.setLoading(false);
      },
      error: (msg) => {
        console.log('error getting tournaments!! ', msg);
        this.loader.setErrorMessage('Error loading tournaments!');
      },
    });
  }
}
