import { Component, OnInit, Input } from '@angular/core';
import { CourseInfo } from '../../../services/golfpicks/game.model';

@Component({
  selector: 'app-course-overview',
  templateUrl: './course-overview.component.html',
})
export class CourseOverviewComponent implements OnInit {
  @Input() currentRound = 1;
  @Input() courseUrl = '';
  @Input() courseInfo: CourseInfo | null = null;

  constructor() {}

  ngOnInit(): void {}
}
