import { Injectable } from '@angular/core';
import { HttpAuthService } from '../httpauth/http-auth.service';
import { Observable } from 'rxjs';

import { Game } from './game.interfaces';
import { ConfigBaseUrl } from './backend.config';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private configUrl = ConfigBaseUrl() + '/Games';

  constructor(private httpAuth: HttpAuthService) { }

  newModel(): Game {
    return {
      id: '',
      name: '',
      start: '',
      end: '',
      event: '',
      gamers: []
    };
  }

  get(id: string): Observable<Game> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.get(
      methodUrl, { withCredentials: true });
  }

  put(obj: Game): Observable<Game> {
    const methodUrl = this.configUrl;

    return this.httpAuth.put(
      methodUrl, obj, { withCredentials: true });
  }

  post(obj: Game): Observable<Game> {
    const methodUrl = this.configUrl;

    return this.httpAuth.post(
      methodUrl, obj, { withCredentials: true });
  }

  delete(id: string): Observable<boolean> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.delete(
      methodUrl, { withCredentials: true });
  }

  getAll(): Observable<Game[]> {
    const methodUrl = this.configUrl;
    const self = this;

    return new Observable((observer) => {
      this.httpAuth.get(
        methodUrl, { withCredentials: true })
        .subscribe({
          next(data) {
            const games: Game[] = data;

            // sort the games by date
            games.sort(function (a, b) {
              const aDate = Date.parse(a.start);
              const bDate = Date.parse(b.start);

              // console.log(`aDate: ${aDate}, bDate: ${bDate}`);

              if (isNaN(aDate)) {
                console.log('found NaN: ', a);
              }

              if (aDate == bDate) {
                return 0;
              } else {
                return (aDate > bDate) ? -1 : 1;
              }
            });

            observer.next(games);
          },
          error(msg) {
            console.log('error gettting games ', msg);

            observer.error(msg);
          }
        });
    });
  }

  getWithGamerDetail(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/withGamerDetail';

    return this.httpAuth.get(
      methodUrl, { withCredentials: true });
  }

  leaderboard(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/leaderboard';

    return this.httpAuth.get(
      methodUrl, { withCredentials: true });
  }

  savePicks(id: string, gamerid: string, picks: any[]): Observable<Game> {
    const methodUrl = this.configUrl + '/' + id + '/Gamers/' + gamerid + '/picks';

    return this.httpAuth.post(
      methodUrl, picks, { withCredentials: true });
  }

}
