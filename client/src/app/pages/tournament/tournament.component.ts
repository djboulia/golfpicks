import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EventService } from '../../shared/services/golfpicks/event.service';
import { DateFormatterService } from '../../shared/services/date/date-formatter.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { GAMEURLS } from '../../app.routes';
import { EventWithDetails } from '../../shared/services/golfpicks/event.model';
import { Coordinates } from '../../shared/services/golfpicks/course.model';

@Component({
  selector: 'app-tournament',
  templateUrl: './tournament.component.html',
  imports: [PageLoadCardComponent, GoogleMapsModule],
})
export class TournamentComponent implements OnInit {
  id: string | null = null;
  event: EventWithDetails | null = null;

  scoresUrl = GAMEURLS.tournamentLeaders;

  mapZoom = 9;
  mapCenter: google.maps.LatLngLiteral = { lat: 24, lng: 12 };

  constructor(
    private route: ActivatedRoute,
    private eventApi: EventService,
    public dateFormatter: DateFormatterService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loader.setLoading(true);

    if (this.id) {
      // edit an existing user

      // go get this user's record
      this.eventApi.deep(this.id, true).subscribe({
        next: (data) => {
          console.log('data ', data);

          if (!data) {
            this.loader.setErrorMessage('Error loading tournament!');
          } else {
            this.event = data;

            const rounds = data.rounds;

            this.mapCenter = this.formatPosition(rounds[0].course.location);

            this.loader.setLoading(false);
          }
        },
        error: (msg) => {
          console.log('error getting tournament!! ', msg);

          this.loader.setErrorMessage('Error loading tournament!');
        },
      });
    } else {
      console.log('error getting tournament!! ');

      this.loader.setErrorMessage('Error loading tournament!');
    }
  }

  formatPosition(location: Coordinates) {
    return {
      lat: location.lat,
      lng: location.lng,
    };
  }
}
