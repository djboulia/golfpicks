import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-user-score-board',
  templateUrl: './user-score-board.component.html',
  styleUrls: ['./user-score-board.component.scss'],
})
export class UserScoreBoardComponent implements OnInit {
  @Input() gamer: any;
  @Input() roundTitles: string[] = [];

  top5: any = [];
  bottom5: any = [];
  scores: any = [];

  constructor() {}

  ngOnInit(): void {
    this.scores = [...this.gamer.scores];

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

    this.top5 = this.gamer.picks.slice(0, 5);
    this.bottom5 = this.gamer.picks.slice(-5);
  }
}
