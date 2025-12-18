import { Component } from '@angular/core';
import { Gamer, GamerHistory } from '../../shared/services/golfpicks/gamer.model';
import { ActivatedRoute } from '@angular/router';
import { GamerService } from '../../shared/services/golfpicks/gamer.service';
import { mergeMap, map, catchError, throwError } from 'rxjs';
import { GameHistoryComponent } from '../../shared/components/game/game-history/game-history.component';
import { GameNextComponent } from '../../shared/components/game/game-next/game-next.component';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';

@Component({
  selector: 'app-main',
  imports: [GameNextComponent, GameHistoryComponent, PageLoadComponent],
  templateUrl: './main.component.html',
})
export class MainComponent {
  user: Gamer;
  games: GamerHistory;
  testingMode = false;

  leaderboardUrl = '/component/leaderboard';
  picksUrl = '/component/picks';

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private gamerApi: GamerService,
  ) {
    this.user = gamerApi.newModel();
    this.games = gamerApi.newHistory();
  }

  ngOnInit(): void {
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

          catchError((err) => this.loadingError('Error loading game!', err)),
        )
        .subscribe(() => {
          console.log('games ', this.games);

          this.loading = false;
        });
    });
  }

  private loadingError(msg: string, err: any) {
    this.errorMessage = msg;
    this.loading = false;

    return throwError(() => new Error(err));
  }
}
