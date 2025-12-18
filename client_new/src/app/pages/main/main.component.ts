import { Component } from '@angular/core';
import { Gamer, GamerHistory } from '../../shared/services/golfpicks/gamer.model';
import { ActivatedRoute } from '@angular/router';
import { GamerService } from '../../shared/services/golfpicks/gamer.service';
import { mergeMap, map, catchError, throwError } from 'rxjs';
import { GameHistoryComponent } from '../../shared/components/game/game-history/game-history.component';
import { GameNextComponent } from '../../shared/components/game/game-next/game-next.component';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { LoaderService } from '../../shared/services/loader.service';

@Component({
  selector: 'app-main',
  imports: [GameNextComponent, GameHistoryComponent, PageLoadComponent],
  templateUrl: './main.component.html',
})
export class MainComponent {
  user: Gamer | undefined = undefined;
  games: GamerHistory | undefined = undefined;
  testingMode = false;

  constructor(
    private route: ActivatedRoute,
    private gamerApi: GamerService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.loader.setLoading(true);

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

          this.loader.setLoading(false);
        });
    });
  }

  private loadingError(msg: string, err: any) {
    this.loader.setErrorMessage(msg);

    return throwError(() => new Error(err));
  }
}
