import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {

  // we emit a change event when the auth data or status changes
  @Output() authChange = new EventEmitter<any>();

  constructor() { }

  isAdmin(): boolean {
    return this.isLoggedIn() ? localStorage.getItem('admin') === 'true' : false;
  }

  getUser(): string {
    return this.isLoggedIn() ? (localStorage.getItem('username') as string) : '';
  }

  getName(): string {
    return this.isLoggedIn() ? (localStorage.getItem('name') as string) : '';
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedin') === 'true';
  }

  /**
   * start a new session
   * 
   * @param name Display name
   * @param username email 
   * @param admin is this person an admin?
   */
  init(name: string, username: string, admin: boolean) {

    localStorage.setItem('isLoggedin', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('name', name);

    if (admin) {
      localStorage.setItem('admin', 'true')
    } else {
      localStorage.removeItem('admin')
    }

    this.authChange.emit({
      name: name,
      username: username,
      admin: admin
    });
  }

  /**
   * remove the current session data
   */
  destroy() {
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('admin');
    localStorage.removeItem('username');
    localStorage.removeItem('name');

    this.authChange.emit(null);
  }

}
