import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';

import { Gamer } from '../backend/gamer.interfaces';
import { GamerService } from '../backend/gamer.service';

@Injectable()
export class AuthService {

  // we emit a change event when the auth data or status changes
  @Output() authChange = new EventEmitter<any>();

  constructor(private gamerService: GamerService) { }

  isAdmin(): boolean {
    return this.isLoggedIn() ? localStorage.getItem('admin') === 'true' : false;
  }

  getUserid(): string {
    return this.isLoggedIn() ? (localStorage.getItem('userid') as string) : '';
  }

  getName(): string {
    return this.isLoggedIn() ? (localStorage.getItem('name') as string) : '';
  }

  private updateData(data: Gamer) {
    const userid = data.attributes.username;
    const name = data.attributes.name;
    const admin = data.attributes.admin;

    localStorage.setItem('isLoggedin', 'true');
    localStorage.setItem('userid', userid);
    localStorage.setItem('name', name);

    if (admin) {
      localStorage.setItem('admin', 'true')
    } else {
      localStorage.removeItem('admin')
    }

    this.authChange.emit(data);
  }


  login(userid: string, password: string): Observable<boolean> {
    return new Observable((observer) => {
      console.log(`login found ${userid} and ${password}`);

      const self = this;

      this.gamerService.login(userid, password)
        .subscribe({
          next(data) {
            console.log('logged in! ', data);

            self.updateData(data);

            observer.next(true);
          },
          error(msg) {
            console.log('error logging in! ', msg);

            self.logout();
            observer.next(false);
          }
        });

    })
  }

  /**
   * Refresh the user's info from the backend server
   * 
   * @returns 
   */
  refresh(): Observable<boolean> {
    const self = this;

    return new Observable((observer) => {
      this.gamerService.currentUser()
        .subscribe({
          next(data) {
            console.log('refresh found user: ', data);

            self.updateData(data);

            observer.next(true);
          },
          error(msg) {
            console.log('error gettting current user! ', msg);

            self.logout();
            observer.next(false);
          }
        });
    });
  }

  logout() {
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('admin');
    localStorage.removeItem('userid');
    localStorage.removeItem('name');

    this.authChange.emit(null);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedin') === 'true';
  }
}
