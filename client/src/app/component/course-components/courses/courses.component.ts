import { Component, OnInit } from '@angular/core';

import { CourseService } from 'src/app/shared/services/backend/course.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit {

  courses: any = null;

  baseUrl = '/component/course';
  baseUrlInfo = '/component/courseinfo';

  errorMessage: any = null;

  isLoaded = false;

  constructor(private courseApi: CourseService) { }

  ngOnInit(): void {
    const self = this;

    this.errorMessage = null;

    this.courseApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.courses = data;
          self.isLoaded = true;
        },
        error(msg) {
          console.log('error getting courses!! ', msg);
          self.errorMessage = "Error loading courses!";
          self.isLoaded = false;
        }
      });
  }

}
