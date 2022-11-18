import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, map, catchError, throwError, TimeoutConfig } from 'rxjs';

import { NgxSpinnerService } from "ngx-spinner";
import { BaseLoadingComponent } from '../base.loading.component';

import { GameService } from 'src/app/shared/services/backend/game.service';
import { EventService } from 'src/app/shared/services/backend/event.service';
import { GameDayService } from 'src/app/shared/services/gameday/game-day.service';
import { GamerService } from 'src/app/shared/services/backend/gamer.service';

@Component({
  selector: 'app-picks',
  templateUrl: './picks.component.html',
  styleUrls: ['./picks.component.scss']
})
export class PicksComponent extends BaseLoadingComponent implements OnInit {
  readonly NUM_SELECTIONS = 10;
  readonly NUM_TOP_ALLOWED = 2;
  readonly NUM_TOP_RANK = 10;

  id: any = null;
  currentUser: any = null;
  game: any = null;
  event: any = null;
  golfers: any = null;
  changed = false;
  canSubmit = true;

  testingMode = false;
  debugMode = false;

  picksMessage: string = '';

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private gameApi: GameService,
    private eventApi: EventService,
    private gameDay: GameDayService,
    private gamerApi: GamerService
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

        this.loadPicks();
      })
  }

  private loadPicks() {
    console.log('loading picks');

    // go get our game information from multiple sources
    this.gameApi.get(this.id)
      .pipe(
        map((data) => this.game = data),
        // map((data) => { console.log('found game ', data); return data; }),

        // get event that corresponds to this game
        mergeMap((data) => this.eventApi.deep(data.attributes.event, true)),
        map((data) => this.event = data),
        map((data) => this.golfers = data.golfers),
        // map((data) => { console.log('found event ', data); return data; }),

        mergeMap((data) => this.gamerApi.currentUser()),
        map((data) => this.currentUser = data),

        catchError(err => this.loadingError('Error loading picks!', err))
      )
      .subscribe((data) => {

        if (!this.pageCanLoad()) {
          return;
        }

        if (!this.game.attributes.gamers) {

          this.game.gamers = [{
            "user": this.currentUser.id,
            "picks": []
          }];

        } else {
          // might have previously stored picks
          var picks = [];
          var gamers = this.game.attributes.gamers;

          for (var i = 0; i < gamers.length; i++) {
            var gamer = gamers[i];
            if (gamer.user === this.currentUser.id) {
              picks = gamer.picks;
            }
          }

          this.loadSavedPicks(this.golfers, picks);
        }

        this.loaded();
      });
  }

  private addPlayer(players: any[], ndx: number) {
    players[ndx].selected = true;
  };

  private findPlayerIndex(players: any[], id: string) {
    // use a player id to find the index for this player in the scores list
    for (let i = 0; i < players.length; i++) {
      if (players[i].player_id == id) {
        return i;
      }
    }

    return -1;
  };

  private updateSelections(selections: any[], players: any[]) {
    const self = this;

    let numSelections = 0;
    let numTopPicks = 0;

    selections.forEach(function (selection) {
      numSelections++;
      if (selection.index <= self.NUM_TOP_RANK) numTopPicks++;
    });

    // now disable based on this

    players.forEach(function (player) {
      if (player.selected) { // always enable any currently selected scores
        player.selectable = true;
        //                    console.log("Selected : " + JSON.stringify(player));
      } else {
        // disable the rest based on current picks
        if (numSelections >= self.NUM_SELECTIONS) {
          player.selectable = false;
        } else if (numTopPicks >= self.NUM_TOP_ALLOWED && player.index <= self.NUM_TOP_RANK) {
          player.selectable = false;
        } else {
          player.selectable = true;
        }
      }
    });

    console.log("selections = " + numSelections + ", topPicks = " + numTopPicks);

    return numSelections;
  };


  private getSelections(players: any[]) {
    const selections: any[] = [];

    players.forEach(function (player) {
      if (player.selected) selections.push(player);
    });

    return selections;
  };

  private loadSavedPicks(players: any[], picks: any) {
    // for each pick we find, move it from scores to selections
    for (let i = 0; i < picks.length; i++) {
      const ndx = this.findPlayerIndex(players, picks[i].id);

      if (ndx < 0) {
        console.error("invalid pick " + picks[i].id + " found!");
      } else {
        this.addPlayer(players, ndx);
      }
    }

    // reset changed flag, we just loaded the saved picks.
    this.changed = false;

    const selections = this.getSelections(players);

    const numSelections = this.updateSelections(selections, players);
    this.updateSubmitStatus(numSelections);
  };

  /**
   * check conditions for page to load.  in this case the tournament 
   * can't be in progress or over if we are making picks
   * 
   * @returns boolean - true if page can load, false otherwise
   */
  private pageCanLoad() {

    let gameDetails: any = this.gameDay.getGameDetails(this.game);

    // always allow the page to load in testing mode
    if (this.testingMode) return true;

    // give players a 10 hr grace period
    // (10AM on day of tournament) to complete picks
    gameDetails = this.gameDay.addGracePeriod(gameDetails, 10);

    if (this.gameDay.tournamentInProgress(
      gameDetails.start,
      gameDetails.end)
    ) {
      this.error("Tournament is in progress, picks can no longer be made.");
      return false;
    }
    else if (this.gameDay.tournamentComplete(
      gameDetails.start,
      gameDetails.end)
    ) {
      this.error("This tournament has already ended, picks can no longer be made.");
      return false;
    }

    return true;
  }

  updateSubmitStatus(numSelections: number) {
    if (numSelections >= this.NUM_SELECTIONS) {
      this.canSubmit = true;
      this.picksMessage = "Press Save Picks to save.";
    } else {
      const remaining = this.NUM_SELECTIONS - numSelections;
      const picks = (remaining > 1) ? "picks" : "pick";

      this.canSubmit = false;
      this.picksMessage = remaining + " " + picks + " remaining.";
    }
  }

  onUpdatePlayer(golfer: any) {
    //			console.log("item: " + JSON.stringify(item));
    console.log("clicked on item " + golfer.name + " state is " + golfer.selected);

    // change the state when the checkbox is clicked.
    golfer.selected = !golfer.selected;

    this.picksMessage = '';

    var selections = this.getSelections(this.golfers);

    // enforce the game rules here
    // tell player how many more they can pick
    // enable/disable the submit button
    const numSelections = this.updateSelections(selections, this.golfers);

    this.updateSubmitStatus(numSelections);
  }

  onSubmit() {
    this.picksMessage = "Saving picks...";

    // update this person's picks in the game data
    const selections = this.getSelections(this.golfers);

    const picks: any[] = [];
    selections.forEach(function (selection) {
      picks.push({
        "id": selection.player_id
      });
    });

    console.log("saving picks: " + JSON.stringify(picks));

    this.gameApi.savePicks(this.id, this.currentUser.id, picks)
      .pipe(
        catchError(err => this.loadingError('Error saving picks!', err))
      )
      .subscribe((data) => {
        this.picksMessage = "Picks saved.";
        this.changed = false;
      });
  }

  private loadingError(msg: string, err: any) {
    console.log(msg);

    this.error(msg);

    return throwError(() => new Error(err));
  }

}
