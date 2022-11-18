import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from "ngx-spinner";

import { CourseService } from 'src/app/shared/services/backend/course.service';

@Component({
  selector: 'app-courseinfo',
  templateUrl: './courseinfo.component.html',
  styleUrls: ['./courseinfo.component.scss']
})
export class CourseinfoComponent implements OnInit {

  id: any;
  course: any;
  frontNine: any;
  backNine: any;
  weather: any;
  isLoaded = false;
  errorMessage: any = null;
  parentUrl = '/component/courses';
  baseUrl = '/component/course'

  mapCenter: google.maps.LatLngLiteral = { lat: 24, lng: 12 };
  mapZoom = 9;

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private courseApi: CourseService
  ) { }

  /**
   * slope and rating aren't always included.  if they're
   * missing, we plug in zero values for both
   * 
   * @param data 
   * @returns 
   */
  private fixCourseData(data: any) {
    if (!data.attributes.slope) {
      data.attributes.slope = 0;
    }
    if (!data.attributes.rating) {
      data.attributes.rating = 0;
    }

    return data;
  }

  private frontNineData(data: any) {
    const frontNine = {
      yardage: 0,
      par: 0,
      holes: <any>[]
    }

    const holes = data.attributes.holes;
    if (holes) {
      for (var i = 0; i < 9; i++) {
        var hole = holes[i];

        frontNine.yardage += parseInt(hole.yardage);
        frontNine.par += parseInt(hole.par);
        frontNine.holes.push(hole);
      }
    }

    return frontNine;
  }

  private backNineData(data: any) {
    const backNine = {
      yardage: 0,
      par: 0,
      holes: <any>[]
    }

    const holes = data.attributes.holes;
    if (holes) {
      for (var i = 9; i < 18; i++) {
        var hole = holes[i];

        backNine.yardage += parseInt(hole.yardage);
        backNine.par += parseInt(hole.par);
        backNine.holes.push(hole);
      }
    }

    return backNine;
  }

  private formatWeatherData(data: any) {
    data.temp = Math.round(data.temp);
    data.wind = Math.round(data.wind);
    data.metric.temp = Math.round(data.metric.temp);

    return data;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    console.log(`id: ${this.id}`);

    this.loading();

    if (this.id) {
      // edit an existing user
      const self = this;

      // go get this user's record
      this.courseApi.get(this.id)
        .subscribe({
          next(data) {
            console.log('data ', data);

            self.course = self.fixCourseData(data);
            self.frontNine = self.frontNineData(data);
            self.backNine = self.backNineData(data);

            self.mapCenter.lat = Number.parseFloat(self.course.attributes.location.lat);
            self.mapCenter.lng = Number.parseFloat(self.course.attributes.location.lng);

            self.loaded();
          },
          error(msg) {
            self.error('Error loading course!')
          }
        });

      this.courseApi.weather(this.id)
        .subscribe({
          next(data) {
            console.log('data ', data);

            self.weather = self.formatWeatherData(data);
          },
          error(msg) {
            console.log('Error loading weather!')
          }
        });
    } else {
      // no id found, just route back to the parent URL
      this.router.navigate([this.parentUrl]);
    }

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
