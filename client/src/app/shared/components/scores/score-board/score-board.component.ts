import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-score-board',
  templateUrl: './score-board.component.html',
  imports: [CommonModule],
})
export class ScoreBoardComponent implements OnInit {
  @Input() roundTitles: string[] = [];
  @Input() gamers: any[] = [];

  constructor() {}

  ngOnInit(): void {}
}
