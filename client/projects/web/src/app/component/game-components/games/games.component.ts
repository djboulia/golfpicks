import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { Game } from '../../../shared/services/backend/game.interfaces';
import { GameService } from '../../../shared/services/backend/game.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss'],
})
export class GamesComponent extends BaseLoadingComponent implements OnInit {
  games: Game[] = [];

  basePlayersUrl = '/component/gameplayer';
  baseUrl = '/component/game';
  constructor(
    private spinner: NgxSpinnerService,
    private gameApi: GameService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    this.gameApi.getAll().subscribe({
      next(data) {
        console.log('data ', data);

        self.games = data;
        self.loaded();
      },
      error(msg) {
        console.log('error getting games!! ', msg);
        self.error('Error loading games!');
      },
    });
  }
}
