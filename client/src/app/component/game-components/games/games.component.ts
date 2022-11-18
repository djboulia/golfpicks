import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";
import { BaseLoadingComponent } from '../../base.loading.component';

import { GameService } from 'src/app/shared/services/backend/game.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent extends BaseLoadingComponent implements OnInit {

  games: any = null;

  basePlayersUrl = '/component/gameplayer';
  baseUrl = '/component/game';
  ;

  constructor(
    private spinner: NgxSpinnerService,
    private gameApi: GameService
  ) {
    super(spinner);
  }

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
}
