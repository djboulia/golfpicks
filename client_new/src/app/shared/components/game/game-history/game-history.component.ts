import { Component, Input } from '@angular/core';

import { GamerHistory } from '../../../services/golfpicks/gamer.model';

@Component({
  selector: 'app-game-history',
  templateUrl: './game-history.component.html',
  imports: [],
  styles: '',
})
export class GameHistoryComponent {
  @Input() games: GamerHistory | undefined;

  leaderboardUrl = '/component/leaderboard';

  constructor() {
    this.games = undefined;
  }
}
