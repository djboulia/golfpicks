import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { EventService } from '../../../shared/services/backend/event.service';

@Component({
  selector: 'app-eventleaders',
  templateUrl: './eventleaders.component.html',
  styleUrls: ['./eventleaders.component.scss'],
})
export class EventLeadersComponent extends BaseLoadingComponent implements OnInit {
  id: string | null = null;
  event: any = null;
  playerDetail: string | null = null;

  leadersUrl = '/component/eventleaders';
  eventUrl = '/component/event';

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private eventApi: EventService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe((params) => {
      console.log(params);
      const playerDetail = params['playerDetail'];
      this.playerDetail = playerDetail ? playerDetail : null;
      console.log('playerDetail: ', playerDetail);

      this.loading();

      if (this.id) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        // go get the golfer scores for this event
        this.eventApi.leaders(this.id).subscribe({
          next(data) {
            console.log('event leaders ', data);

            if (!data) {
              self.error('Error loading scores!');
            } else {
              self.event = data;

              self.loaded();

              setTimeout(() => {
                document?.getElementById(playerDetail)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                  inline: 'nearest',
                });
              }, 500);
            }
          },
          error(msg) {
            console.log('error loading scores!! ', msg);

            self.error('Error loading scores!');
          },
        });
      } else {
        this.error('Error loading scores!');
      }
    });
  }

  onPlayerClick(playerId: string) {
    // toggle the player detail; if it's open, close it, otherwise open it
    if (this.playerDetail === playerId) {
      this.playerDetail = null;
      return;
    }

    this.playerDetail = playerId;
  }
}
