import { Component, OnInit } from '@angular/core';

import { Course } from '../../shared/services/golfpicks/course.model';
import { CourseService } from '../../shared/services/golfpicks/course.service';
import { LoaderService } from '../../shared/services/loader.service';
import { GAMEURLS } from '../../app.routes';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  imports: [PageLoadCardComponent, ButtonComponent],
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];

  baseUrl = GAMEURLS.course;
  baseUrlInfo = GAMEURLS.courseInfo;

  constructor(
    private courseApi: CourseService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.loader.setLoading(true);

    this.courseApi.getAll().subscribe({
      next: (data) => {
        console.log('data ', data);

        this.courses = data;
        this.loader.setLoading(false);
      },
      error: (msg) => {
        console.log('error getting courses!! ', msg);
        this.loader.setErrorMessage('Error loading courses!');
      },
    });
  }
}
