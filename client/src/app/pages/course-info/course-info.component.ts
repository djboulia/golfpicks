import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { GoogleMapsModule } from '@angular/google-maps';

import { Course } from '../../shared/services/golfpicks/course.model';
import { CourseService } from '../../shared/services/golfpicks/course.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadCardComponent } from '../../shared/components/common/page-load-card/page-load-card.component';
import { WeatherComponent } from '../../shared/components/weather/weather.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { GAMEURLS } from '../../app.routes';

@Component({
  selector: 'app-course-info',
  templateUrl: './course-info.component.html',
  imports: [GoogleMapsModule, PageLoadCardComponent, WeatherComponent, ButtonComponent],
})
export class CourseInfoComponent implements OnInit {
  id: string | null = null;
  course: Course;
  frontNine: any;
  backNine: any;
  weather: any;

  parentUrl = GAMEURLS.courses;
  baseUrl = GAMEURLS.course;

  mapCenter: google.maps.LatLngLiteral = { lat: 24, lng: 12 };
  mapZoom = 9;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseApi: CourseService,
    protected loader: LoaderService,
  ) {
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

    this.loader.setLoading(true);

    if (this.id) {
      // edit an existing user

      // go get this user's record
      this.courseApi.get(this.id).subscribe({
        next: (data) => {
          console.log('data ', data);

          this.course = this.fixCourseData(data);
          this.frontNine = this.frontNineData(data);
          this.backNine = this.backNineData(data);

          this.mapCenter.lat = this.course.location.lat;
          this.mapCenter.lng = this.course.location.lng;

          this.loader.setLoading(false);
        },
        error: () => {
          this.loader.setErrorMessage('Error loading course!');
        },
      });

      this.courseApi.weather(this.id).subscribe({
        next: (data) => {
          console.log('data ', data);

          this.weather = this.formatWeatherData(data);
        },
        error: () => {
          console.log('Error loading weather!');
        },
      });
    } else {
      // no id found, just route back to the parent URL
      this.router.navigate([this.parentUrl]);
    }
  }
}
