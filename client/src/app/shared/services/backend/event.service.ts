import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigBaseUrl } from './backend.config';
import { Event, Schedule } from './event.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private configUrl = ConfigBaseUrl() + '/Events';

  constructor(private http: HttpClient) { }

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
      rounds: []
    };
  }

  get(id: string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.get<Event>(
      methodUrl, { withCredentials: true });
  }

  put(obj : Event) {
    const methodUrl = this.configUrl;

    return this.http.put<Event>(
      methodUrl, obj, {withCredentials: true});
  }

  post(obj : Event) {
    const methodUrl = this.configUrl;

    return this.http.post<Event>(
      methodUrl, obj, {withCredentials: true});
  }

  delete(id : string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.delete<boolean>(
      methodUrl, {withCredentials: true});
  }
  getAll() {
    const methodUrl = this.configUrl;

    return this.http.get<Event[]>(
      methodUrl, { withCredentials: true });
  }

  deep(id: string, sortByRanking: boolean) {
    const queryParameters = (sortByRanking) ? '?playerSort=ranking' : '';
    const methodUrl = this.configUrl + '/' + id + '/deep' + queryParameters;

    return this.http.get<any>(
      methodUrl, { withCredentials: true });
  }

  leaders(id: string) {
    const methodUrl = this.configUrl + '/' + id + '/leaders';

    return this.http.get<any>(
      methodUrl, { withCredentials: true });
  }

  weather(id: string) {
    const methodUrl = this.configUrl + '/' + id + '/weather';

    return this.http.get<any>(
      methodUrl, { withCredentials: true });
  }

  tourSchedule(year: number) {
    const methodUrl = this.configUrl + '/tour/pga/' + year;

    return this.http.get<Schedule[]>(
      methodUrl, { withCredentials: true });
  }

  newsFeed(id: string) {
    const methodUrl = this.configUrl + '/' + id + '/newsfeed';

    return this.http.get<any>(
      methodUrl, { withCredentials: true });
  }


}
