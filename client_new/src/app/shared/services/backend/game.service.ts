import { Injectable } from '@angular/core';
import { HttpAuthService } from '../http-auth.service';
import { Observable } from 'rxjs';

import { Game, GameDay } from './game.interfaces';
import { ConfigBaseUrl } from './backend.config';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private configUrl = ConfigBaseUrl() + '/Games';

  constructor(private httpAuth: HttpAuthService) {}

  newModel(): Game {
    return {
      id: '',
      name: '',
      start: '',
      end: '',
      event: '',
      gamers: [],
    };
  }

  newGameDayModel(): GameDay {
    return {
      id: '',
      name: '',
      start: '',
      end: '',
      event: '',
      gamers: [],
      gameDay: {
        inProgress: false,
        complete: false,
      },
    };
  }
  get(id: string): Observable<Game> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  put(obj: Game): Observable<Game> {
    const methodUrl = this.configUrl;

    return this.httpAuth.put(methodUrl, obj, { withCredentials: true });
  }

  post(obj: Game): Observable<Game> {
    const methodUrl = this.configUrl;

    return this.httpAuth.post(methodUrl, obj, { withCredentials: true });
  }

  delete(id: string): Observable<boolean> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.delete(methodUrl, { withCredentials: true });
  }

  getAll(): Observable<Game[]> {
    const methodUrl = this.configUrl;

    return new Observable((observer) => {
      this.httpAuth.get(methodUrl, { withCredentials: true }).subscribe({
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
              return aDate > bDate ? -1 : 1;
            }
          });

          observer.next(games);
        },
        error(msg) {
          console.log('error gettting games ', msg);

          observer.error(msg);
        },
      });
    });
  }

  gamerDetails(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/gamerDetails';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  leaderboard(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/leaderboard';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  savePicks(id: string, gamerid: string, picks: any[]): Observable<Game> {
    const methodUrl = this.configUrl + '/' + id + '/Gamers/' + gamerid + '/picks';

    return this.httpAuth.post(methodUrl, picks, { withCredentials: true });
  }

  gameDay(id: string): Observable<GameDay> {
    const methodUrl = this.configUrl + '/' + id + '/gameDay';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }
}
