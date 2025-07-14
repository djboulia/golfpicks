import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-user-score-board',
  templateUrl: './user-score-board.component.html',
  styleUrls: ['./user-score-board.component.scss'],
})
export class UserScoreBoardComponent implements OnInit {
  @Input() gamer: any;
  @Input() roundTitles: string[] = [];
  @Input() eventLeaderUrl: string = '';
  @Input() showDetails = false;

  top5: any = [];
  bottom5: any = [];
  scores: any = [];

  constructor() {}

  ngOnInit(): void {
    this.scores = [...this.gamer.scores];

    const cutIndex = this.scores.indexOf('CUT');
    if (cutIndex > -1) {
      // remove all scores except the first CUT
      this.scores = this.scores.map((_score: any, index: number) => {
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

    this.top5 = this.gamer.picks.slice(0, 5);
    this.bottom5 = this.gamer.picks.slice(-5);
  }
}
