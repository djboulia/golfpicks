import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { LeaderboardGamer } from '../../../services/golfpicks/game.model';

@Component({
  selector: 'app-score-board',
  templateUrl: './score-board.component.html',
  imports: [CommonModule],
})
export class ScoreBoardComponent implements OnInit {
  @Input() roundTitles: string[] = [];
  @Input() gamers: LeaderboardGamer[] = [];

  constructor() {}

  ngOnInit(): void {}
}
