import { Component, Input } from '@angular/core';

import { GamerHistory } from '../../../services/golfpicks/gamer.model';
import { GAMEURLS } from '../../../../app.routes';

@Component({
  selector: 'app-game-history',
  templateUrl: './game-history.component.html',
  imports: [],
  styles: '',
})
export class GameHistoryComponent {
  @Input() games: GamerHistory | undefined = undefined;

  leaderboardUrl = GAMEURLS.leaderboard;
}
