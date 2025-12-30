import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EventService } from '../../shared/services/golfpicks/event.service';
import { GAMEURLS } from '../../app.routes';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';
import { CommonModule } from '@angular/common';
import { TournamentLeaderDetailComponent } from '../../shared/components/tournament/tournament-leader-detail/tournament-leader-detail.component';
import { EventLeaders, GolferLeaderDetails } from '../../shared/services/golfpicks/event.model';

@Component({
  selector: 'app-tournament-leaders',
  templateUrl: './tournament-leaders.component.html',
  imports: [CommonModule, PageLoadCardComponent, TournamentLeaderDetailComponent],
})
export class TournamentLeadersComponent implements OnInit {
  id: string | null = null;
  event: EventLeaders | null = null;
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

  getGolferScore(golfer: GolferLeaderDetails, roundNumber: string): string {
    if (!golfer || !roundNumber || !this.event) {
      return '-';
    }

    if (roundNumber !== '1' && roundNumber !== '2' && roundNumber !== '3' && roundNumber !== '4') {
      return '-';
    }

    const score = golfer[roundNumber];
    return score ? score : '-';
  }

  isLowScore(golfer: GolferLeaderDetails, roundNumber: string): boolean {
    if (!golfer || !roundNumber || !this.event) {
      return false;
    }

    const roundIndex = parseInt(roundNumber);
    const lowRound = this.event.lowRounds[roundIndex];
    const golferScore = this.getGolferScore(golfer, roundNumber);

    return lowRound === golferScore;
  }

  isUnderPar(golfer: GolferLeaderDetails): boolean {
    if (!golfer) {
      return false;
    }

    const todayScore = parseInt(golfer.today);
    return todayScore < 0;
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
