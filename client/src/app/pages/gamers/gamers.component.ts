import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GameService } from '../../shared/services/golfpicks/game.service';
import { DateFormatterService } from '../../shared/services/date/date-formatter.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';

@Component({
  selector: 'app-gamers',
  templateUrl: './gamers.component.html',
  imports: [PageLoadComponent],
})
export class GamersComponent implements OnInit {
  id: any = null;
  game: any = null;
  picks: any = [];
  nopicks: any = [];

  constructor(
    private route: ActivatedRoute,
    private gameApi: GameService,
    public dateFormatter: DateFormatterService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loader.setLoading(true);

    this.gameApi.gamerDetails(this.id).subscribe({
      next: (data) => {
        console.log('game ', data);

        this.game = data;

        const gamers = data.gamers;
        const notPlaying = data.notplaying;

        // see which gamers have made their picks
        this.picks = [];
        this.nopicks = [];

        for (let i = 0; i < gamers.length; i++) {
          const gamer = gamers[i];

          if (gamer.picks) {
            this.picks.push(gamer);
          } else {
            this.nopicks.push(gamer);
          }
        }

        // any gamers who are not yet playing in
        // this event should be in the "nopicks" list
        for (let i = 0; i < notPlaying.length; i++) {
          const gamer = notPlaying[i];

          this.nopicks.push(gamer);
        }

        console.log('picks: ' + JSON.stringify(this.picks));
        console.log('nopicks: ' + JSON.stringify(this.nopicks));

        this.loader.setLoading(false);
      },
      error: (msg) => {
        console.log('error getting game!! ', msg);
        this.loader.setErrorMessage('Error loading game!');
      },
    });
  }
}
