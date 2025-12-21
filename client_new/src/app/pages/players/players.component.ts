import { Component, OnInit } from '@angular/core';

import { GamerService } from '../../shared/services/golfpicks/gamer.service';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { LoaderService } from '../../shared/services/loader.service';
import { GAMEURLS } from '../../app.routes';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  imports: [PageLoadComponent, ButtonComponent],
})
export class PlayersComponent implements OnInit {
  users: any = null;

  baseUrl = GAMEURLS.player;

  constructor(
    private gamerApi: GamerService,
    protected loader: LoaderService,
  ) {}

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
