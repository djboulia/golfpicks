import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EventService } from '../../shared/services/golfpicks/event.service';
import { GAMEURLS } from '../../app.routes';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { CommonModule } from '@angular/common';
import { TournamentLeaderDetailComponent } from '../../shared/components/tournament/tournament-leader-detail/tournament-leader-detail.component';

@Component({
  selector: 'app-tournament-leaders',
  templateUrl: './tournament-leaders.component.html',
  imports: [CommonModule, PageLoadComponent, TournamentLeaderDetailComponent],
})
export class TournamentLeadersComponent implements OnInit {
  id: string | null = null;
  event: any = null;
  playerDetail: string | null = null;

  leadersUrl = GAMEURLS.tournamentLeaders;
  eventUrl = GAMEURLS.tournamentOverview;

  constructor(
    private route: ActivatedRoute,
    private eventApi: EventService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe((params) => {
      console.log(params);
      const playerDetail = params['playerDetail'];
      this.playerDetail = playerDetail ? playerDetail : null;
      console.log('playerDetail: ', playerDetail);

      this.loader.setLoading(true);

      if (this.id) {
        // go get the golfer scores for this event
        this.eventApi.leaders(this.id).subscribe({
          next: (data) => {
            console.log('event leaders ', data);

            if (!data) {
              this.loader.setErrorMessage('Error loading scores!');
            } else {
              this.event = data;

              this.loader.setLoading(false);

              setTimeout(() => {
                document?.getElementById(playerDetail)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest',
                });
              }, 500);
            }
          },
          error: (msg) => {
            console.log('error loading scores!! ', msg);

            this.loader.setErrorMessage('Error loading scores!');
          },
        });
      } else {
        this.loader.setErrorMessage('Error loading scores!');
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
