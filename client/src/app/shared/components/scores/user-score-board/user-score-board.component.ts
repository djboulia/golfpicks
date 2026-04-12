import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardGamer, LeaderboardGolfer } from '../../../services/golfpicks/game.model';

@Component({
  selector: 'app-user-score-board',
  templateUrl: './user-score-board.component.html',
  imports: [CommonModule],
})
export class UserScoreBoardComponent implements OnChanges {
  @Input() gamer: LeaderboardGamer | null = null;
  @Input() roundTitles: string[] = [];
  @Input() tournamentLeaderUrl: string = '';

  top5: LeaderboardGolfer[] = [];
  bottom5: LeaderboardGolfer[] = [];
  scores: (string | number)[] = [];

  constructor() {}

  ngOnChanges(): void {
    this.scores = [...(this.gamer?.scores || [])];

    const cutIndex = this.scores.indexOf('CUT');
    if (cutIndex > -1) {
      // remove all scores except the first CUT
      this.scores = this.scores.map((_score: string | number, index: number) => {
        if (index === cutIndex) {
          return 'CUT';
        }
        return '';
      });
    } else {
      // player not cut, now just show the current active score
      for (let i = 0; i < this.scores.length; i++) {
        if (this.scores[i] === '-') {
          this.scores[i] = '';
        } else {
          if (i < this.scores.length - 1) {
            if (this.scores[i + 1] !== '-') {
              // later score is available, remove earlier scores
              this.scores[i] = '';
            }
          }
        }
      }
    }
    // console.log(`game picks ${this.gamer?.name}` + JSON.stringify(this.gamer?.picks));

    this.top5 = this.gamer?.picks.slice(0, 5) || [];
    this.bottom5 = this.gamer?.picks.slice(-5) || [];
  }
}
