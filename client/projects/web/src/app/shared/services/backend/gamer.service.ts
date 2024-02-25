import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpAuthService } from '../httpauth/http-auth.service';

import { ConfigBaseUrl } from './backend.config';
import { Gamer, GamerHistory } from './gamer.interfaces';

@Injectable({
  providedIn: 'root',
})
export class GamerService {
  private configUrl = ConfigBaseUrl() + '/Gamers';

  constructor(
    private http: HttpClient,
    private httpAuth: HttpAuthService,
  ) {}

  newModel(): Gamer {
    return {
      id: '',
      name: '',
      username: '',
      password: '',
      admin: false,
    };
  }

  newHistory(): GamerHistory {
    return {
      active: {
        inProgress: false,
        joined: false,
        event: '',
        eventid: '',
      },
      history: [],
    };
  }

  login(username: String, password: String) {
    const methodUrl = this.configUrl + '/login';

    // login is the special case where we don't need
    // the auth handler since this function actually
    // logs the user in and creates a new session
    return this.http.post<Gamer>(
      methodUrl,
      { username: username, password: password },
      { withCredentials: true },
    );
  }

  currentUser(): Observable<Gamer> {
    const methodUrl = this.configUrl + '/currentUser';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  get(id: string): Observable<Gamer> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  put(obj: Gamer): Observable<Gamer> {
    const methodUrl = this.configUrl;

    return this.httpAuth.put(methodUrl, obj, { withCredentials: true });
  }

  post(obj: Gamer): Observable<Gamer> {
    const methodUrl = this.configUrl;

    return this.httpAuth.post(methodUrl, obj, { withCredentials: true });
  }

  delete(id: string): Observable<boolean> {
    const methodUrl = this.configUrl + '/' + id;

    return this.httpAuth.delete(methodUrl, { withCredentials: true });
  }

  getAll(): Observable<Gamer[]> {
    const methodUrl = this.configUrl;

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }

  gameHistory(id: string): Observable<any> {
    const methodUrl = this.configUrl + '/' + id + '/Games';

    return this.httpAuth.get(methodUrl, { withCredentials: true });
  }
}
