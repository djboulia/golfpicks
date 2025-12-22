import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthSessionService } from './shared/services/auth/auth-session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authSession: AuthSessionService,
  ) {}

  canActivate() {
    if (this.authSession.isLoggedIn()) {
      console.log('logged in!');
      return true;
    }

    console.log('not logged in, routing to login page');
    this.router.navigate(['/login']);
    return false;
  }
}
