import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { EventService } from '../../../shared/services/backend/event.service';
import { DateFormatterService } from '../../../shared/services/date/date-formatter.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
})
export class EventComponent extends BaseLoadingComponent implements OnInit {
  id: string | null = null;
  event: any = null;

  scoresUrl = '/component/eventleaders';

  mapZoom = 9;
  mapCenter: google.maps.LatLngLiteral = { lat: 24, lng: 12 };

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loading();

    if (this.id) {
      // edit an existing user
      const self = this;

      // go get this user's record
      this.eventApi.deep(this.id, true).subscribe({
        next(data) {
          console.log('data ', data);

          if (!data) {
            self.error('Error loading tournament!');
          } else {
            self.event = data;

            const rounds = data.rounds;

            self.mapCenter = self.formatPosition(rounds[0].course.location);

            self.loaded();
          }
        },
        error(msg) {
          console.log('error getting tournament!! ', msg);

          self.error('Error loading tournament!');
        },
      });
    } else {
      console.log('error getting tournament!! ');

      this.error('Error loading tournament!');
    }
  }

  formatPosition(location: any) {
    return {
      lat: Number.parseFloat(location.lat),
      lng: Number.parseFloat(location.lng),
    };
  }
}
