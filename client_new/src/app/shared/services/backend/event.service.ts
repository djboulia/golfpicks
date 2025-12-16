import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpAuthService } from '../http-auth.service';
import { ConfigBaseUrl } from './backend.config';
import { Event, Schedule } from './event.interfaces';
import { Weather } from './course.interface';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private configUrl = ConfigBaseUrl() + '/Events';

  constructor(private httpAuth: HttpAuthService) {}

  private currentSeason(): string {
    const SEPTEMBER = 8; // zero based month index

    const today = new Date();

    // new PGA season actually starts in September of the prior
    // calendar year, so bump the season after September
    if (today.getMonth() >= SEPTEMBER) {
      return (today.getFullYear() + 1).toString();
    }

    return today.getFullYear().toString();
  }

  newModel(): Event {
    return {
      id: '',
      name: '',
      start: '',
      end: '',
      season: this.currentSeason(),
      provider: 'tourdata',
      scoreType: 'pga-live-scoring',
      tournament_id: '',
      rounds: [],
    };
  }

  get(id: string): Observable<Event> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  put(obj: Event): Observable<Event> {
    const methodUrl = this.configUrl;

    return this.httpAuth.put(methodUrl, obj, { withCredentials: true });
  }

  post(obj: Event): Observable<Event> {
    const methodUrl = this.configUrl;

    return this.httpAuth.post(methodUrl, obj, { withCredentials: true });
  }

  delete(id: string): Observable<boolean> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.delete(methodUrl, { withCredentials: true });
  }
  getAll(): Observable<Event[]> {
    const methodUrl = this.configUrl;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  deep(id: string, sortByRanking: boolean): Observable<any> {
    const queryParameters = sortByRanking ? '?playerSort=ranking' : '';
    const methodUrl = this.configUrl + '/' + id + '/deep' + queryParameters;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  leaders(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/leaders';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  weather(id: string): Observable<Weather> {
    const methodUrl = this.configUrl + '/' + id + '/weather';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  tourSchedule(year: number): Observable<Schedule[]> {
    const methodUrl = this.configUrl + '/tour/pga/' + year;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  newsFeed(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/newsfeed';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }
}
