import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { GameService } from '../../../shared/services/backend/game.service';
import { DateFormatterService } from '../../../shared/services/date/date-formatter.service';

@Component({
  selector: 'app-gameplayer',
  templateUrl: './gameplayer.component.html',
  styleUrls: ['./gameplayer.component.scss'],
})
export class GameplayerComponent extends BaseLoadingComponent implements OnInit {
  id: any = null;
  game: any = null;
  picks: any = [];
  nopicks: any = [];

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private gameApi: GameService,
    public dateFormatter: DateFormatterService,
  ) {
    super(spinner);

    this.game = gameApi.newModel();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    this.gameApi.gamerDetails(this.id).subscribe({
      next(data) {
        console.log('game ', data);

        self.game = data;

        const gamers = data.gamers;
        const notPlaying = data.notplaying;

        // see which gamers have made their picks
        self.picks = [];
        self.nopicks = [];

        for (let i = 0; i < gamers.length; i++) {
          const gamer = gamers[i];

          if (gamer.picks) {
            self.picks.push(gamer);
          } else {
            self.nopicks.push(gamer);
          }
        }

        // any gamers who are not yet playing in
        // this event should be in the "nopicks" list
        for (let i = 0; i < notPlaying.length; i++) {
          const gamer = notPlaying[i];

          self.nopicks.push(gamer);
        }

        console.log('picks: ' + JSON.stringify(self.picks));
        console.log('nopicks: ' + JSON.stringify(self.nopicks));

        self.loaded();
      },
      error(msg) {
        console.log('error getting game!! ', msg);
        self.error('Error loading game!');
      },
    });
  }
}
