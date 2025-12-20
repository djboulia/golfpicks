import { Component, OnInit } from '@angular/core';

import { Game } from '../../shared/services/golfpicks/game.model';
import { GameService } from '../../shared/services/golfpicks/game.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { GAMEURLS } from '../../app.routes';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  imports: [PageLoadComponent, ButtonComponent],
})
export class GamesComponent implements OnInit {
  games: Game[] = [];

  basePlayersUrl = GAMEURLS.gamers;
  baseUrl = GAMEURLS.game;

  constructor(
    private gameApi: GameService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.loader.setLoading(true);

    this.gameApi.getAll().subscribe({
      next: (data) => {
        console.log('data ', data);

        this.games = data;
        this.loader.setLoading(false);
      },
      error: (msg) => {
        console.log('error getting games!! ', msg);
        this.loader.setErrorMessage('Error loading games!');
      },
    });
  }
}
