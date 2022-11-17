import { Component, OnInit } from '@angular/core';

import { GameService } from 'src/app/shared/services/backend/game.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit {


  games: any = null;

  basePlayersUrl = '/component/gameplayer';
  baseUrl = '/component/game';

  errorMessage: any = null;

  isLoaded = false;

  constructor(private gameApi: GameService) { }

  ngOnInit(): void {
    const self = this;

    this.errorMessage = null;

    this.gameApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.games = data;
          self.isLoaded = true;
        },
        error(msg) {
          console.log('error getting games!! ', msg);
          self.errorMessage = "Error loading games!";
          self.isLoaded = false;
        }
      });
  }
}
