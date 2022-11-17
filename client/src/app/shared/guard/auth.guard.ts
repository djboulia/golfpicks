import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth:AuthService) { }

  canActivate() {
    if (this.auth.isLoggedIn()) {
      console.log('logged in!');
      return true;
    }

    console.log('not logged in, routing to login page');
    this.router.navigate(['/login']);
    return false;
  }

}
