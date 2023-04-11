import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-course-info',
  templateUrl: './course-overview.component.html',
  styleUrls: ['./course-overview.component.scss'],
})
export class CourseOverviewComponent implements OnInit {
  @Input() currentRound = 1;
  @Input() courseUrl = '';
  @Input() courseInfo: any;

  constructor() {}

  ngOnInit(): void {}
}
