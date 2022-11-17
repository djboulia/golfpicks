import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    private route: ActivatedRoute,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    console.log(`id: ${this.id}`);

    if (this.id) {
      // edit an existing user
      const self = this;

      // go get this user's record
      this.eventApi.deep(this.id, true)
        .subscribe({
          next(data) {
            console.log('data ', data);

            if (!data) {
              self.errorMessage = "Error loading tournament!";
              self.isLoaded = false;  
            } else {
              self.event = data;

              const rounds = data.rounds;

              self.mapCenter = self.formatPosition(rounds[0].course.location);
  
              self.isLoaded = true;
            }
          },
          error(msg) {
            console.log('error getting tournament!! ', msg);

            self.errorMessage = "Error loading tournament!";
            self.isLoaded = false;
          }
        });
    } else {
      console.log('error getting tournament!! ');

      this.errorMessage = "Error loading tournament!";
      this.isLoaded = false;
    }

  }

  formatPosition(location:any) {
    return {
      lat: Number.parseFloat(location.lat),
      lng: Number.parseFloat(location.lng)
    }
  }

}

