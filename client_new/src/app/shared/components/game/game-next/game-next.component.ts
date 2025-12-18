import { Component, Input } from '@angular/core';

import { GamerHistory } from '../../../services/golfpicks/gamer.model';
import { GAMEURLS } from '../../../../app.routes';

@Component({
  selector: 'app-game-next',
  templateUrl: './game-next.component.html',
  imports: [],
  styles: '',
})
export class GameNextComponent {
  @Input() testingMode? = false;
  @Input() games: GamerHistory | undefined;

  leaderboardUrl = GAMEURLS.leaderboard;
  picksUrl = GAMEURLS.picks;

  constructor() {
    this.games = undefined;
  }

  activeTournamentMessage(): string {
    if (!this.testingMode && this.games?.active.inProgress) {
      return 'The tournament is currently in progress';
    }

    if (this.games?.active.eventid) {
      const picksUrl = this.picksUrl + '/id/' + this.games.active.eventid;

      if (this.games.active.joined) {
        return `The game has not yet started.  You can still update your <a href="${picksUrl}">picks</a>`;
      } else {
        return `You have not yet joined this game. Make your <a href="${picksUrl}">picks</a>`;
      }
    }

    return 'No upcoming tournament.';
  }
}
