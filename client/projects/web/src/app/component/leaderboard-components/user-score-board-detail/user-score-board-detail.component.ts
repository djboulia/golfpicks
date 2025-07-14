import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, map, catchError, throwError } from 'rxjs';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { GameDay } from '../../../shared/services/backend/game.interfaces';
import { GameService } from '../../../shared/services/backend/game.service';
import { EventService } from '../../../shared/services/backend/event.service';
import { GameDayService } from '../../../shared/services/gameday/game-day.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './user-score-board-detail.component.html',
  styleUrls: ['./user-score-board-detail.component.scss'],
})
export class UserScoreBoardDetailComponent extends BaseLoadingComponent implements OnInit {
  id: string | null = null;
  gamerId: string | null = null;
  game: GameDay;
  gameDay: any = null;
  gamers: any = null;
  gamer: any = null;
  leaderboard: any = null;
  currentRound: any = null;
  roundTitles: string[] = [];

  testingMode = false;
  debugMode = false;

  eventOverviewUrl = '/component/event';
  eventLeaderUrl = '/component/eventleaders';
  courseUrl = '/component/courseinfo';

  reloadTimerId: any = null;

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private gameApi: GameService,
    private eventApi: EventService,
  ) {
    super(spinner);

    this.game = gameApi.newGameDayModel();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.gamerId = this.route.snapshot.paramMap.get('gamerid');
    console.log(`id: ${this.id}`);

    this.loading();

    if (!this.id) {
      this.error('No game found!');
      return;
    }

    this.route.queryParams.subscribe((params) => {
      console.log(params);
      this.testingMode = params['testingMode'] && params['testingMode'] === 'true' ? true : false;
      console.log('testingMode: ', this.testingMode);

      // if debugMode is a url parameter, write more info to the log
      this.debugMode = params['debugMode'] && params['debugMode'] === 'true' ? true : false;

      this.loadLeaderboard();
      this.loadGolferScores(this.game.event);
    });
  }

  private loadLeaderboard() {
    if (!this.id) {
      this.error('No game found!');
      return; // no game id
    }
    console.log('loading leaderboard data for id ', this.id);

    // go get our game information from multiple sources
    this.gameApi
      .gameDay(this.id)
      .pipe(
        map((game) => (this.game = game)),
        // map((data) => { console.log('found game ', data); return data; }),

        map((game) => (this.gameDay = new GameDayService(game))),

        // get event that corresponds to this game
        mergeMap((gameDay) => this.gameApi.leaderboard(gameDay.getId())),
        map((leaderboard) => (this.leaderboard = leaderboard)),
        // map((data) => { console.log('found event ', data); return data; }),

        catchError((err) => this.loadError('Error loading game!', err)),
      )
      .subscribe(async () => {
        if (this.hasNotStarted(this.gameDay)) {
          this.tooEarlyMessage(this.gameDay);
          return;
        }

        const roundInfo = this.leaderboard.roundInfo;

        this.gamers = this.leaderboard.gamers;
        this.currentRound = roundInfo.currentRound;
        this.roundTitles = roundInfo.roundTitles;

        if (!this.gamers) {
          this.error('No players for the current game.');
          return;
        }

        this.gamer = this.gamers.find((gamer: any) => gamer.objectId === this.gamerId);
        console.log('gamer: ', this.gamer);

        const golfers = await this.loadGolferScores(this.game.event).catch((err) => {
          console.log('error loading golfer scores ', err);
          this.error('Error loading golfer scores!');
          return null;
        });

        if (!golfers) {
          this.error('Error loading golfer scores!');
          return;
        }

        // add golfer details to each pick
        for (const pick of this.gamer.picks) {
          const golfer = (golfers as any[]).find(
            (golfer: any) => golfer.player_id === pick.player_id,
          );
          pick.details = golfer;
        }
        console.log('gamer: ', this.gamer);

        this.loaded();
      });
  }

  private loadGolferScores(eventId: string) {
    return new Promise((resolve, reject) => {
      this.eventApi.leaders(eventId).subscribe({
        next(data) {
          console.log('event leaders ', data);

          if (!data) {
            reject('Error loading scores!');
          } else {
            resolve(data?.golfers);
          }
        },
        error(msg) {
          console.log('error loading scores!! ', msg);
          reject('Error loading scores!');
        },
      });
    });
  }

  private hasNotStarted(gameDay: GameDayService) {
    // by pass this check in testing mode
    if (this.testingMode) {
      return false;
    }

    if (!gameDay.tournamentInProgress() && !gameDay.tournamentComplete()) {
      return true;
    }

    return false;
  }

  private tooEarlyMessage(gameDay: GameDayService) {
    const start = gameDay.getStart();
    const name = gameDay.getName();

    this.error(`'${name}' has not yet started. Check back again on ${start}`);
  }

  private loadError(msg: string, err: any) {
    this.error(msg);

    return throwError(() => new Error(err));
  }
}
