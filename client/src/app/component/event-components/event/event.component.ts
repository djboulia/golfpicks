import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from "ngx-spinner";

import { EventService } from 'src/app/shared/services/backend/event.service';
import { DateFormatterService } from 'src/app/shared/services/date/date-formatter.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit {
  id: any = null;
  event: any = null;

  errorMessage: any = null;

  scoresUrl = '/component/eventleaders';

  isLoaded = false;

  mapZoom = 9;
  mapCenter: google.maps.LatLngLiteral = {lat: 24, lng: 12};

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    console.log(`id: ${this.id}`);

    this.loading();

    if (this.id) {
      // edit an existing user
      const self = this;

      // go get this user's record
      this.eventApi.deep(this.id, true)
        .subscribe({
          next(data) {
            console.log('data ', data);

            if (!data) {
              self.error("Error loading tournament!");
            } else {
              self.event = data;

              const rounds = data.rounds;

              self.mapCenter = self.formatPosition(rounds[0].course.location);
  
              self.loaded();
            }
          },
          error(msg) {
            console.log('error getting tournament!! ', msg);

            self.error("Error loading tournament!");
          }
        });
    } else {
      console.log('error getting tournament!! ');

      this.error("Error loading tournament!");
    }

  }

  formatPosition(location:any) {
    return {
      lat: Number.parseFloat(location.lat),
      lng: Number.parseFloat(location.lng)
    }
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

