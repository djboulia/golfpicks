import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-score-board',
  templateUrl: './score-board.component.html',
  styleUrls: ['./score-board.component.scss'],
})
export class ScoreBoardComponent implements OnInit {
  @Input() roundTitles: string[] = [];
  @Input() gamers: any[] = [];

  constructor() {}

  ngOnInit(): void {}
}
