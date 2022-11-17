import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GamerService } from 'src/app/shared/services/backend/gamer.service';

@Component({
  selector: 'app-game-history',
  templateUrl: './game-history.component.html',
  styleUrls: ['./game-history.component.scss']
})
export class GameHistoryComponent implements OnInit {

  user: any;
  games: any;
  testingMode = false;

  leaderboardUrl = '/component/leaderboard';
  picksUrl = "/component/picks";

  statusMessage: any = "";
  errorMessage: any = null;
  infoMessage: any = null;

  isLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private gamerApi: GamerService
  ) { }

  ngOnInit(): void {
    const self = this;

    this.errorMessage = null;
    this.infoMessage = null;

    this.route.queryParams
      .subscribe(params => {
        console.log(params);
        self.testingMode = (params['testingMode'] && params['testingMode'] === 'true') ? true : false;
        console.log('testingMode: ', self.testingMode);

        self.gamerApi.currentUser()
          .subscribe({
            next(data) {
              console.log('data ', data);

              self.user = data;
              console.log(self.user);

              self.gamerApi.gameHistory(data.id)
                .subscribe({
                  next(data) {
                    console.log('data ', data);

                    self.games = data;

                    self.statusMessage = self.activeTournamentMessage(data);

                    self.isLoaded = true;
                  },
                  error(msg) {
                    console.log('error getting current user!! ', msg);
                    self.errorMessage = "Error getting current user!";
                    self.isLoaded = false;
                  }
                });

            },
            error(msg) {
              console.log('error getting current user!! ', msg);
              self.errorMessage = "Error getting current user!";
              self.isLoaded = false;
            }
          });
      })
  }

  activeTournamentMessage(games: any) : string {
    let statusMessage = "";

    if (!this.testingMode && games.active.inProgress) {
      statusMessage = "The tournament is currently in progress";
    } else {
      if (games.active.eventid) {
        const picksUrl = this.picksUrl + "/id/" + games.active.eventid;

        if (games.active.joined) {
          statusMessage = 'The game has not yet started.  You can still update your <a href="' + picksUrl + '">picks</a>';
        } else {
          statusMessage = 'You have not yet joined this game. Make your <a href="' + picksUrl + '">picks</a>';
        }
      } else {
        statusMessage = 'No upcoming tournament.';
      }
    }    

    return statusMessage;
  }
}