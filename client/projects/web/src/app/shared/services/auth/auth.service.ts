import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';

import { AuthSessionService } from './auth-session.service';
import { Gamer } from '../backend/gamer.interfaces';
import { GamerService } from '../backend/gamer.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // we emit a change event when the auth data or status changes
  @Output() authChange = new EventEmitter<any>();

  constructor(
    private gamerApi: GamerService,
    private authSession: AuthSessionService,
  ) {}

  private updateData(data: Gamer) {
    const name = data.name;
    const username = data.username;
    const admin = data.admin;

    this.authSession.init(name, username, admin);

    this.authChange.emit(data);
  }

  login(userid: string, password: string): Observable<boolean> {
    return new Observable((observer) => {
      console.log(`login found ${userid} and ${password}`);

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      this.gamerApi.login(userid, password).subscribe({
        next(gamer) {
          console.log('logged in! ', gamer);

          self.updateData(gamer);

          observer.next(true);
        },
        error(msg) {
          console.log('error logging in! ', msg);

          self.logout();
          observer.next(false);
        },
      });
    });
  }

  /**
   * Refresh the user's info from the backend server
   *
   * @returns
   */
  refresh(): Observable<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return new Observable((observer) => {
      this.gamerApi.currentUser().subscribe({
        next(gamer) {
          console.log('refresh found user: ', gamer);

          self.updateData(gamer);

          observer.next(true);
        },
        error(msg) {
          console.log('error gettting current user! ', msg);

          self.logout();
          observer.next(false);
        },
      });
    });
  }

  logout() {
    this.authSession.destroy();

    this.authChange.emit(null);
  }
}
