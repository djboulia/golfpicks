import { Component } from '@angular/core';
import { Gamer, GamerHistory } from '../../shared/services/golfpicks/gamer.model';
import { ActivatedRoute } from '@angular/router';
import { GamerService } from '../../shared/services/golfpicks/gamer.service';
import { mergeMap, map, catchError, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { GameHistoryComponent } from '../../shared/components/game/game-history/game-history.component';
import { GameNextComponent } from '../../shared/components/game/game-next/game-next.component';

@Component({
  selector: 'app-main',
  imports: [CommonModule, PageBreadcrumbComponent, GameNextComponent, GameHistoryComponent],
  templateUrl: './main.component.html',
})
export class MainComponent {
  user: Gamer;
  games: GamerHistory;
  testingMode = false;

  leaderboardUrl = '/component/leaderboard';
  picksUrl = '/component/picks';

  loading = false;
  statusMessage = '';
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private gamerApi: GamerService,
  ) {
    this.user = gamerApi.newModel();
    this.games = gamerApi.newHistory();
  }

  error(msg: string) {
    this.infoMessage = msg;
    this.loading = false;
  }

  ngOnInit(): void {
    this.infoMessage = null;

    this.loading = true;

    this.route.queryParams.subscribe((params) => {
      console.log(params);
      this.testingMode = params['testingMode'] && params['testingMode'] === 'true' ? true : false;
      console.log('testingMode: ', this.testingMode);

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

          this.statusMessage = this.activeTournamentMessage(this.games);

          this.loading = false;
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
