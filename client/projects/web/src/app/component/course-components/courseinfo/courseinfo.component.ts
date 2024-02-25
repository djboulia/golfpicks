import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { Course } from '../../../shared/services/backend/course.interface';
import { CourseService } from '../../../shared/services/backend/course.service';

@Component({
  selector: 'app-courseinfo',
  templateUrl: './courseinfo.component.html',
  styleUrls: ['./courseinfo.component.scss'],
})
export class CourseinfoComponent extends BaseLoadingComponent implements OnInit {
  id: string | null = null;
  course: Course;
  frontNine: any;
  backNine: any;
  weather: any;

  parentUrl = '/component/courses';
  baseUrl = '/component/course';

  mapCenter: google.maps.LatLngLiteral = { lat: 24, lng: 12 };
  mapZoom = 9;

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private courseApi: CourseService,
  ) {
    super(spinner);

    this.course = courseApi.newModel();
  }

  /**
   * slope and rating aren't always included.  if they're
   * missing, we plug in zero values for both
   *
   * @param data
   * @returns
   */
  private fixCourseData(data: any) {
    if (!data.slope) {
      data.slope = 0;
    }
    if (!data.rating) {
      data.rating = 0;
    }

    return data;
  }

  private frontNineData(data: any) {
    const frontNine = {
      yardage: 0,
      par: 0,
      holes: <any>[],
    };

    const holes = data.holes;
    if (holes) {
      for (let i = 0; i < 9; i++) {
        const hole = holes[i];

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
      holes: <any>[],
    };

    const holes = data.holes;
    if (holes) {
      for (let i = 9; i < 18; i++) {
        const hole = holes[i];

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
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loading();

    if (this.id) {
      // edit an existing user
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      // go get this user's record
      this.courseApi.get(this.id).subscribe({
        next(data) {
          console.log('data ', data);

          self.course = self.fixCourseData(data);
          self.frontNine = self.frontNineData(data);
          self.backNine = self.backNineData(data);

          self.mapCenter.lat = self.course.location.lat;
          self.mapCenter.lng = self.course.location.lng;

          self.loaded();
        },
        error() {
          self.error('Error loading course!');
        },
      });

      this.courseApi.weather(this.id).subscribe({
        next(data) {
          console.log('data ', data);

          self.weather = self.formatWeatherData(data);
        },
        error() {
          console.log('Error loading weather!');
        },
      });
    } else {
      // no id found, just route back to the parent URL
      this.router.navigate([this.parentUrl]);
    }
  }
}
