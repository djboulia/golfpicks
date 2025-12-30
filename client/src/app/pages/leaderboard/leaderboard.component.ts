import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, map, catchError, throwError } from 'rxjs';

import {
  CourseInfo,
  GameDay,
  Leaderboard,
  LeaderboardGamer,
} from '../../shared/services/golfpicks/game.model';
import { GameService } from '../../shared/services/golfpicks/game.service';
import { EventService } from '../../shared/services/golfpicks/event.service';
import { GameDayService } from '../../shared/services/golfpicks/game-day.service';
import { DateHelperService } from '../../shared/services/date/date-helper.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';
import { WeatherComponent } from '../../shared/components/weather/weather.component';
import { CourseOverviewComponent } from '../../shared/components/course/course-overview/course-overview.component';
import { TournamentInfoComponent } from '../../shared/components/tournament/tournament-info/tournament-info.component';
import { ScoreBoardComponent } from '../../shared/components/scores/score-board/score-board.component';
import { GAMEURLS } from '../../app.routes';
import { UserScoreBoardComponent } from '../../shared/components/scores/user-score-board/user-score-board.component';
import { Weather } from '../../shared/services/golfpicks/course.model';

@Component({
  selector: 'app-leaderboard',
  imports: [
    PageLoadCardComponent,
    CourseOverviewComponent,
    TournamentInfoComponent,
    WeatherComponent,
    ScoreBoardComponent,
    UserScoreBoardComponent,
  ],
  templateUrl: './leaderboard.component.html',
  styles: '',
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  id: string | null = null;
  game: GameDay;
  gameDayService: GameDayService | null = null;
  gamers: LeaderboardGamer[] | null = null;
  leaderboard: Leaderboard | null = null;
  courseInfo: CourseInfo | null = null;
  currentRound: number | null = null;
  roundTitles: string[] = [];

  weather: Weather | undefined;

  newsFeed: string = '';
  lastUpdate: string = '';

  testingMode = false;
  debugMode = false;

  courseUrl = GAMEURLS.courseInfo;
  tournamentLeaderUrl = GAMEURLS.tournamentLeaders;

  reloadTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private gameApi: GameService,
    private eventApi: EventService,
    protected loader: LoaderService,
  ) {
    this.game = gameApi.newGameDayModel();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loader.setLoading(true);

    if (!this.id) {
      this.loader.setErrorMessage('No game found!');
      return;
    }

    this.route.queryParams.subscribe((params) => {
      console.log(params);
      this.testingMode = params['testingMode'] && params['testingMode'] === 'true' ? true : false;
      console.log('testingMode: ', this.testingMode);

      // if debugMode is a url parameter, write more info to the log
      this.debugMode = params['debugMode'] && params['debugMode'] === 'true' ? true : false;

      this.loadLeaderboard();
    });
  }

  ngOnDestroy(): void {
    // code here
    console.log('onDestroy called');
    if (this.reloadTimerId) {
      console.log('clearing timeout');
      clearTimeout(this.reloadTimerId);
    }
  }

  private loadLeaderboard() {
    console.log('loading leaderboard data');

    if (!this.id) {
      this.loader.setErrorMessage('No valid game found!');
      return;
    }

    // go get our game information from multiple sources
    this.gameApi
      .gameDay(this.id)
      .pipe(
        map((game) => (this.game = game)),
        // map((data) => { console.log('found game ', data); return data; }),

        map((game) => (this.gameDayService = new GameDayService(game))),

        // get event that corresponds to this game
        mergeMap((gameDay) => this.gameApi.leaderboard(gameDay.getId())),
        map((leaderboard) => (this.leaderboard = leaderboard)),
        // map((data) => { console.log('found event ', data); return data; }),

        catchError((err) => this.loadError('Error loading game!', err)),
      )
      .subscribe(() => {
        if (!this.gameDayService) {
          this.loader.setErrorMessage('No valid game found!');
          return;
        }

        if (this.hasNotStarted(this.gameDayService)) {
          this.tooEarlyMessage(this.gameDayService);
          return;
        }

        const courseInfo = this.leaderboard?.courseInfo;
        const roundInfo = this.leaderboard?.roundInfo;

        this.gamers = this.leaderboard?.gamers ?? null;
        this.currentRound = roundInfo?.currentRound ?? null;
        this.roundTitles = roundInfo?.roundTitles ?? [];
        this.courseInfo = this.currentRound ? courseInfo?.[this.currentRound - 1] ?? null : null;

        if (!this.gamers) {
          this.loader.setErrorMessage('No players for the current game.');
          return;
        }

        this.loader.setLoading(false);

        this.setLastUpdate();

        this.loadWeather(this.gameDayService.getEventId());

        this.loadNewsFeed(this.gameDayService.getEventId());

        this.reloadTimer();
      });
  }

  private setLastUpdate() {
    const date = new DateHelperService();

    this.lastUpdate = 'Last Update: ' + date.dayOfWeekString() + ', ' + date.timeString();
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

    this.loader.setErrorMessage(`'${name}' has not yet started. Check back again on ${start}`);
  }

  /**
   * refresh from the backend every few minutes
   */
  private reloadTimer() {
    const RELOAD_INTERVAL = 5000 * 60; // 5 minutes

    this.reloadTimerId = setTimeout(() => {
      this.loadLeaderboard();
    }, RELOAD_INTERVAL);
  }

  private loadWeather(eventId: string) {
    // get weather details for this game
    this.eventApi
      .weather(eventId)
      .pipe(
        map((data) => (this.weather = this.formatWeatherData(data))),

        catchError((err) => this.loadError('Error loading weather!', err)),
      )
      .subscribe(() => {});
  }

  private loadNewsFeed(eventId: string) {
    // get news ticker data for this game
    this.eventApi
      .newsFeed(eventId)
      .pipe(
        map((data) => (this.newsFeed = this.formatNewsFeed(data))),

        catchError((err) => this.loadError('Error loading weather!', err)),
      )
      .subscribe(() => {});
  }

  private formatNewsFeed(feedItems: string[]): string {
    // load each feed item into our ticker
    let feedString = '';

    for (let i = 0; i < feedItems.length; i++) {
      const feedItem = feedItems[i];

      if (feedString) {
        feedString += ' &nbsp;&nbsp~&nbsp;&nbsp; ' + feedItem;
      } else {
        feedString = feedItem;
      }
    }

    return feedString;
  }

  private formatWeatherData(data: Weather): Weather {
    data.temp = Math.round(data.temp);
    data.wind = Math.round(data.wind);
    data.metric.temp = Math.round(data.metric.temp);

    return data;
  }

  private loadError(msg: string, err: Error) {
    this.loader.setErrorMessage(msg);

    return throwError(() => err);
  }
}
