import { Component, OnInit } from '@angular/core';

import { GamerService } from '../../shared/services/golfpicks/gamer.service';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';
import { LoaderService } from '../../shared/services/loader.service';
import { GAMEURLS } from '../../app.routes';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { Gamer } from '../../shared/services/golfpicks/gamer.model';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  imports: [PageLoadCardComponent, ButtonComponent],
})
export class PlayersComponent implements OnInit {
  users: Gamer[] | null = null;

  baseUrl = GAMEURLS.player;

  constructor(private gamerApi: GamerService, protected loader: LoaderService) {}

  ngOnInit(): void {
    this.loader.setLoading(true);

    this.gamerApi.getAll().subscribe({
      next: (data) => {
        console.log('data ', data);

        this.users = data;
        this.loader.setLoading(false);
      },
      error: (msg) => {
        console.log('error getting users!! ', msg);
        this.loader.setErrorMessage('Error loading users!');
      },
    });
  }
}
