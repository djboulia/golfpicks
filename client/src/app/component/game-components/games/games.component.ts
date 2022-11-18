import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";

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

  constructor(
    private spinner: NgxSpinnerService,
    private gameApi: GameService
  ) { }

  ngOnInit(): void {
    const self = this;

    this.loading();

    this.gameApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.games = data;
          self.loaded();
        },
        error(msg) {
          console.log('error getting games!! ', msg);
          self.error("Error loading games!");
        }
      });
  }

  private loading() {
    this.errorMessage = null;
    this.spinner.show();
    this.isLoaded = false;
  }

  private error(msg: string) {
    console.log(msg);

    this.errorMessage = msg;
    this.spinner.hide();
    this.isLoaded = false;
  }

  private loaded() {
    this.spinner.hide();
    this.isLoaded = true;
  }
}
