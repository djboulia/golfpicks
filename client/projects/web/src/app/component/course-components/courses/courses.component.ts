import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { Course } from '../../../shared/services/backend/course.interface';
import { CourseService } from '../../../shared/services/backend/course.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
})
export class CoursesComponent extends BaseLoadingComponent implements OnInit {
  courses: Course[] = [];

  baseUrl = '/component/course';
  baseUrlInfo = '/component/courseinfo';

  constructor(
    private spinner: NgxSpinnerService,
    private courseApi: CourseService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    this.courseApi.getAll().subscribe({
      next(data) {
        console.log('data ', data);

        self.courses = data;
        self.loaded();
      },
      error(msg) {
        console.log('error getting courses!! ', msg);
        self.error('Error loading courses!');
      },
    });
  }
}
