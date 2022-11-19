import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Game } from './game.interfaces';
import { ConfigBaseUrl } from './backend.config';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private configUrl = ConfigBaseUrl() + '/Games';

  constructor(private http: HttpClient) { }

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

  get(id: string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.get<Game>(
      methodUrl, { withCredentials: true });
  }

  put(obj: Game) {
    const methodUrl = this.configUrl;

    return this.http.put<Game>(
      methodUrl, obj, { withCredentials: true });
  }

  post(obj: Game) {
    const methodUrl = this.configUrl;

    return this.http.post<Game>(
      methodUrl, obj, { withCredentials: true });
  }

  delete(id: string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.delete<boolean>(
      methodUrl, { withCredentials: true });
  }

  getAll(): Observable<Game[]> {
    const methodUrl = this.configUrl;
    const self = this;

    return new Observable((observer) => {
      this.http.get<Game[]>(
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

  getWithGamerDetail(id: string) {
    const methodUrl = this.configUrl + '/' + id + '/withGamerDetail';

    return this.http.get<any>(
      methodUrl, { withCredentials: true });
  }

  leaderboard(id: string) {
    const methodUrl = this.configUrl + '/' + id + '/leaderboard';

    return this.http.get<any>(
      methodUrl, { withCredentials: true });
  }

  savePicks(id: string, gamerid: string, picks: any[]) {
    const methodUrl = this.configUrl + '/' + id + '/Gamers/' + gamerid + '/picks';

    return this.http.post<Game>(
      methodUrl, picks, { withCredentials: true });
  }

}
