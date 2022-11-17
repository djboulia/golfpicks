import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConfigBaseUrl } from './backend.config';
import { Gamer, GamerAttributes } from './gamer.interfaces';

@Injectable()
export class GamerService {

  private configUrl = ConfigBaseUrl() + '/Gamers';

  constructor(private http: HttpClient) { }

  newModel() : Gamer {
    return {
      id: '',
      className: 'Gamer',
      attributes: {
        name: '',
        username: '',
        password: '',
        admin: false
      }
    };
  }

  login(userid: String, password: String) {
    const methodUrl = this.configUrl + '/login';

    return this.http.post<Gamer>(
      methodUrl,
      { "user": userid, "password": password },
      {withCredentials: true});
  }

  currentUser() {
    const methodUrl = this.configUrl + '/currentUser';

    return this.http.get<Gamer>(
      methodUrl, {withCredentials: true});
  }

  get(id : string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.get<Gamer>(
      methodUrl, {withCredentials: true});
  }

  put(obj : Gamer) {
    const methodUrl = this.configUrl;

    return this.http.put<Gamer>(
      methodUrl, obj, {withCredentials: true});
  }

  post(obj : GamerAttributes) {
    const methodUrl = this.configUrl;

    return this.http.post<GamerAttributes>(
      methodUrl, obj, {withCredentials: true});
  }

  delete(id : string) {
    const methodUrl = this.configUrl + '/' + id;

    return this.http.delete<boolean>(
      methodUrl, {withCredentials: true});
  }

  getAll() {
    const methodUrl = this.configUrl;

    return this.http.get<Gamer[]>(
      methodUrl, {withCredentials: true});
  }

  gameHistory(id : string) {
    const methodUrl = this.configUrl + '/' + id + '/Games';

    return this.http.get<any>(
      methodUrl, {withCredentials: true});
  }



}
