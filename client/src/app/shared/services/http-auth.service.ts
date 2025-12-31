/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subscriber } from 'rxjs';

import { AuthSessionService } from './auth/auth-session.service';

/**
 * wraps http requests with a check to make sure the backend auth
 * is still valid. in the event a 401 (unauthorized) comes back, it means
 * the server session has expired.  we kill our local session data and
 * redirect to the login page when we detect this.
 */
@Injectable({
  providedIn: 'root',
})
export class HttpAuthService {
  constructor(
    private http: HttpClient,
    private authSession: AuthSessionService,
    private router: Router,
  ) {}

  private handleError(observer: Subscriber<any>, res: HttpErrorResponse) {
    if (res.status === 401) {
      // backend login expired/not authorized
      // kill the current session and redirect
      console.log('backend auth failed, destroying session and redirecting to login');
      this.authSession.destroy();

      this.router.navigate(['/login']);
      observer.error(res);
    } else {
      observer.error(res);
    }
  }

  get(url: string, options: any): Observable<any> {
    const self = this;

    return new Observable((observer) => {
      this.http.get<any>(url, options).subscribe({
        next(data) {
          // for successful calls, pass on to the observer
          observer.next(data);
        },
        error(res: HttpErrorResponse) {
          console.log('error during get ', res);

          self.handleError(observer, res);
        },
      });
    });
  }

  patch(url: string, obj: any, options: any): Observable<any> {
    const self = this;

    return new Observable((observer) => {
      this.http.patch<any>(url, obj, options).subscribe({
        next(data) {
          // for successful calls, pass on to the observer
          observer.next(data);
        },
        error(res: HttpErrorResponse) {
          console.log('error during put ', res);

          self.handleError(observer, res);
        },
      });
    });
  }

  post(url: string, obj: any, options: any): Observable<any> {
    const self = this;

    return new Observable((observer) => {
      this.http.post<any>(url, obj, options).subscribe({
        next(data) {
          // for successful calls, pass on to the observer
          observer.next(data);
        },
        error(res: HttpErrorResponse) {
          console.log('error during post ', res);

          self.handleError(observer, res);
        },
      });
    });
  }

  delete(url: string, options: any): Observable<any> {
    const self = this;

    return new Observable((observer) => {
      this.http.delete<any>(url, options).subscribe({
        next(data) {
          // for successful calls, pass on to the observer
          observer.next(data);
        },
        error(res: HttpErrorResponse) {
          console.log('error during delete ', res);

          self.handleError(observer, res);
        },
      });
    });
  }
}
