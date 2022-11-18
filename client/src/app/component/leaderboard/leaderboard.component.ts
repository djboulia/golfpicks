import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, map, catchError, throwError, TimeoutConfig } from 'rxjs';

import { NgxSpinnerService } from "ngx-spinner";
import { BaseLoadingComponent } from '../base.loading.component';


import { GameService } from 'src/app/shared/services/backend/game.service';
import { EventService } from 'src/app/shared/services/backend/event.service';
import { GameDayService } from 'src/app/shared/services/gameday/game-day.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent extends BaseLoadingComponent implements OnInit, OnDestroy {

  id: any = null;
  game: any = null;
  gamers: any = null;
  leaderboard: any = null;
  courseInfo: any = null;
  currentRound: any = null;
  roundTitles: any = null;

  weather: any = {
    temp: '',
    wind: '',
    icon: '',
    metric: {
      temp: '',
      wind: ''
    }
  }

  newsFeed: string = '';
  lastUpdate: string = '';

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
    private gameDay: GameDayService
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    console.log(`id: ${this.id}`);

    this.loading();

    if (!this.id) {
      this.error("No game found!");
      return;
    }

    this.route.queryParams
      .subscribe(params => {
        console.log(params);
        this.testingMode = (params['testingMode'] && params['testingMode'] === 'true') ? true : false;
        console.log('testingMode: ', this.testingMode);

        // if debugMode is a url parameter, write more info to the log
        this.debugMode = (params['debugMode'] && params['debugMode'] === 'true') ? true : false;

        this.loadLeaderboard();
      })
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

    // go get our game information from multiple sources
    this.gameApi.get(this.id)
      .pipe(
        map((data) => this.game = data),
        // map((data) => { console.log('found game ', data); return data; }),

        // get event that corresponds to this game
        mergeMap((data) => this.gameApi.leaderboard(data.id)),
        map((data) => this.leaderboard = data),
        // map((data) => { console.log('found event ', data); return data; }),

        catchError(err => this.loadError('Error loading game!', err))
      )
      .subscribe((data) => {

        const gameDetails = this.gameDay.getGameDetails(this.game);

        if (this.hasNotStarted(gameDetails)) {
          this.tooEarlyMessage(gameDetails);
          return;
        }

        const courseInfo = this.leaderboard.courseInfo;
        const roundInfo = this.leaderboard.roundInfo;

        this.gamers = this.leaderboard.gamers;
        this.currentRound = roundInfo.currentRound;
        this.roundTitles = roundInfo.roundTitles;
        this.courseInfo = courseInfo[this.currentRound - 1];;

        if (!this.gamers) {
          this.error("No players for the current game.");
          return;
        }

        this.loaded();

        this.setLastUpdate();

        this.loadWeather();

        this.loadNewsFeed();

        this.reloadTimer();
      });
  }

  private setLastUpdate() {
    const now = Date.now();

    this.lastUpdate = "Last Update: " +
      this.gameDay.dayOfWeekString(now) + ", " +
      this.gameDay.timeString(now);
  }

  private hasNotStarted(gameDetails: any) {
    const start = gameDetails.start;
    const end = gameDetails.end;

    // by pass this check in testing mode
    if (this.testingMode) {
      return false;
    }

    if (!this.gameDay.tournamentInProgress(start, end) &&
      !this.gameDay.tournamentComplete(start, end)) {

      return true;
    }

    return false;
  };

  private tooEarlyMessage(gameDetails: any) {
    var start = gameDetails.start;
    var eventname = gameDetails.event;

    this.spinner.hide();

    this.error("'" + eventname +
      "' has not yet started. Check back again on " +
      this.gameDay.dateString(start) + ".");
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

  private loadWeather() {
    // get weather details for this game
    this.eventApi.weather(this.game.attributes.event)
      .pipe(
        map((data) => this.weather = this.formatWeatherData(data)),

        catchError(err => this.loadError('Error loading weather!', err))
      )
      .subscribe((data) => {
      });
  }

  private loadNewsFeed() {
    // get news ticker data for this game
    this.eventApi.newsFeed(this.game.attributes.event)
      .pipe(
        map((data) => this.newsFeed = this.formatNewsFeed(data)),

        catchError(err => this.loadError('Error loading weather!', err))
      )
      .subscribe((data) => {
      });
  }

  private formatNewsFeed(feedItems: any[]): string {
    // load each feed item into our ticker
    let feedString = '';

    for (var i = 0; i < feedItems.length; i++) {
      var feedItem = feedItems[i];

      if (feedString) {
        feedString += " &nbsp;&nbsp~&nbsp;&nbsp; " + feedItem;
      } else {
        feedString = feedItem;
      }
    }

    return feedString;
  }

  private formatWeatherData(data: any) {
    data.temp = Math.round(data.temp);
    data.wind = Math.round(data.wind);
    data.metric.temp = Math.round(data.metric.temp);

    return data;
  }

  private loadError(msg: string, err: any) {
    this.error(msg);

    return throwError(() => new Error(err));
  }


}
