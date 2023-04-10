import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-user-score-board',
  templateUrl: './user-score-board.component.html',
  styleUrls: ['./user-score-board.component.scss'],
})
export class UserScoreBoardComponent implements OnInit {
  @Input() gamer: any;
  @Input() roundTitles: string[] = [];

  constructor() {}

  ngOnInit(): void {}
}
