import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpAuthService } from '../http-auth.service';
import { ConfigBaseUrl } from './backend.config';
import { Course, Weather } from './course.interface';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private configUrl = ConfigBaseUrl() + '/Courses';

  constructor(private httpAuth: HttpAuthService) {}

  newModel(): Course {
    const course: Course = {
      id: '',
      name: '',
      par: 0,
      yardage: 0,
      location: {
        lat: 0,
        lng: 0,
      },
      tee: '',
      rating: 0,
      slope: 0,
      holes: [],
    };

    // initialize 18 holes
    for (let i = 1; i < 19; i++) {
      const hole: any = {
        number: i,
      };

      course.holes.push(hole);
    }

    return course;
  }

  weather(id: string): Observable<Weather> {
    const methodUrl = this.configUrl + '/' + id + '/weather';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  get(id: string): Observable<Course> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  put(obj: Course): Observable<Course> {
    const methodUrl = this.configUrl;

    return this.httpAuth.put(methodUrl, obj, { withCredentials: true });
  }

  post(obj: Course): Observable<Course> {
    const methodUrl = this.configUrl;

    return this.httpAuth.post(methodUrl, obj, { withCredentials: true });
  }

  delete(id: string): Observable<boolean> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.delete(methodUrl, { withCredentials: true });
  }

  getAll(): Observable<Course[]> {
    const methodUrl = this.configUrl;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }
}
