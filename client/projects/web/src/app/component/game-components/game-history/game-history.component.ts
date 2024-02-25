import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, map, catchError, throwError, TimeoutConfig } from 'rxjs';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { Gamer, GamerHistory } from '../../../shared/services/backend/gamer.interfaces';
import { GamerService } from '../../../shared/services/backend/gamer.service';

@Component({
  selector: 'app-game-history',
  templateUrl: './game-history.component.html',
  styleUrls: ['./game-history.component.scss'],
})
export class GameHistoryComponent extends BaseLoadingComponent implements OnInit {
  user: Gamer;
  games: GamerHistory;
  testingMode = false;

  leaderboardUrl = '/component/leaderboard';
  picksUrl = '/component/picks';

  statusMessage: any = '';
  infoMessage: any = null;

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private gamerApi: GamerService,
  ) {
    super(spinner);

    this.user = gamerApi.newModel();
    this.games = gamerApi.newHistory();
  }

  ngOnInit(): void {
    const self = this;

    this.infoMessage = null;

    this.loading();

    this.route.queryParams.subscribe((params) => {
      console.log(params);
      self.testingMode = params['testingMode'] && params['testingMode'] === 'true' ? true : false;
      console.log('testingMode: ', self.testingMode);

      this.gamerApi
        .currentUser()
        .pipe(
          map((user) => (this.user = user)),
          // map((data) => { console.log('found game ', data); return data; }),

          // get history for this user
          mergeMap((user) => this.gamerApi.gameHistory(user.id)),
          map((games) => (this.games = games)),

          catchError((err) => this.loadError('Error loading game!', err)),
        )
        .subscribe(() => {
          console.log('games ', this.games);

          this.statusMessage = self.activeTournamentMessage(this.games);

          this.loaded();
        });
    });
  }

  activeTournamentMessage(games: any): string {
    let statusMessage = '';

    if (!this.testingMode && games.active.inProgress) {
      statusMessage = 'The tournament is currently in progress';
    } else {
      if (games.active.eventid) {
        const picksUrl = this.picksUrl + '/id/' + games.active.eventid;

        if (games.active.joined) {
          statusMessage =
            'The game has not yet started.  You can still update your <a href="' +
            picksUrl +
            '">picks</a>';
        } else {
          statusMessage =
            'You have not yet joined this game. Make your <a href="' + picksUrl + '">picks</a>';
        }
      } else {
        statusMessage = 'No upcoming tournament.';
      }
    }

    return statusMessage;
  }

  private loadError(msg: string, err: any) {
    this.error(msg);

    return throwError(() => new Error(err));
  }
}
