import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService } from 'src/app/shared/services/backend/event.service';

@Component({
  selector: 'app-eventleaders',
  templateUrl: './eventleaders.component.html',
  styleUrls: ['./eventleaders.component.scss']
})
export class EventLeadersComponent implements OnInit {

  id: any = null;
  event: any = null;

  errorMessage: any = null;
  eventUrl = '/component/event';

  isLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private eventApi: EventService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')

    if (this.id) {
      // edit an existing user
      const self = this;

      // go get this user's record
      this.eventApi.leaders(this.id)
        .subscribe({
          next(data) {
            console.log('data ', data);

            if (!data) {
              self.errorMessage = "Error loading scores!";
              self.isLoaded = false;  
            } else {
              self.event = data;

              const rounds = data.rounds;

              self.isLoaded = true;
            }
          },
          error(msg) {
            console.log('error getting scores!! ', msg);

            self.errorMessage = "Error loading scores!";
            self.isLoaded = false;
          }
        });
    } else {
      console.log('error getting scores!! ');

      this.errorMessage = "Error loading scores!";
      this.isLoaded = false;
    }
  }
}