import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigBaseUrl } from './backend.config';
import { Course, CourseAttributes, Weather } from './course.interface';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private configUrl = ConfigBaseUrl() + '/Courses';

  constructor(private http: HttpClient) { }

  newModel(): Course {
    const course: any = {
      id: '',
      className: 'Course',
      attributes: {
        name: '',
        par: undefined,
        yardage: undefined,
        location: {
          lat: undefined,
          lng: undefined
        },
        tee: '',
        rating: undefined,
        slope: undefined,
        holes: []
      }
    }

    // initialize 18 holes
    for (let i=1; i<19; i++) {
      const hole : any = {
        number: i
      }

      course.attributes.holes.push(hole);
    }

    return course;
  }

  weather(id: string) {
    const methodUrl = this.configUrl + '/' + id + '/weather';

    return this.http.get<Weather>(
      methodUrl, { withCredentials: true });

  }

  get(id: string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.get<Course>(
      methodUrl, { withCredentials: true });
  }

  put(obj: Course) {
    const methodUrl = this.configUrl;

    return this.http.put<Course>(
      methodUrl, obj, { withCredentials: true });
  }

  post(obj: CourseAttributes) {
    const methodUrl = this.configUrl;

    return this.http.post<CourseAttributes>(
      methodUrl, obj, { withCredentials: true });
  }

  delete(id: string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.delete<boolean>(
      methodUrl, { withCredentials: true });
  }

  getAll() {
    const methodUrl = this.configUrl;

    return this.http.get<Course[]>(
      methodUrl, { withCredentials: true });
  }


}
