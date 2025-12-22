import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-course-overview',
  templateUrl: './course-overview.component.html',
})
export class CourseOverviewComponent implements OnInit {
  @Input() currentRound = 1;
  @Input() courseUrl = '';
  @Input() courseInfo: any;

  constructor() {}

  ngOnInit(): void {}
}
