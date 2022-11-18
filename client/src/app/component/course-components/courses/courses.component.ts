import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";

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

  constructor(
    private spinner: NgxSpinnerService,
    private courseApi: CourseService
  ) { }

  ngOnInit(): void {
    const self = this;

    this.loading();

    this.courseApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.courses = data;
          self.loaded();
        },
        error(msg) {
          console.log('error getting courses!! ', msg);
          self.error("Error loading courses!");
        }
      });
  }

  private loading() {
    this.errorMessage = null;
    this.spinner.show();
    this.isLoaded = false;
  }

  private error(msg: string) {
    console.log(msg);

    this.errorMessage = msg;
    this.spinner.hide();
    this.isLoaded = false;
  }

  private loaded() {
    this.spinner.hide();
    this.isLoaded = true;
  }
}
