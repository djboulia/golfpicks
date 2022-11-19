import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigBaseUrl } from './backend.config';
import { Course, Weather } from './course.interface';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private configUrl = ConfigBaseUrl() + '/Courses';

  constructor(private http: HttpClient) { }

  newModel(): Course {
    const course: Course = {
      id: '',
      name: '',
      par: 0,
      yardage: 0,
      location: {
        lat: 0,
        lng: 0
      },
      tee: '',
      rating: 0,
      slope: 0,
      holes: []
    }

    // initialize 18 holes
    for (let i = 1; i < 19; i++) {
      const hole: any = {
        number: i
      }

      course.holes.push(hole);
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

  post(obj: Course) {
    const methodUrl = this.configUrl;

    return this.http.post<Course>(
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
