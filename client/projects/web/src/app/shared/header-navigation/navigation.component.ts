import { Component, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { Router } from '@angular/router';
import { AuthSessionService } from '../services/auth/auth-session.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent implements AfterViewInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  public config: PerfectScrollbarConfigInterface = {};

  public showSearch = false;

  public name: string;

  constructor(
    private router: Router,
    private authSession: AuthSessionService,
  ) {
    this.name = authSession.getName();

    // add a listener to update for any changes
    authSession.authChange
      .subscribe(() => {
        this.name = authSession.getName();
      });
  }

  ngAfterViewInit() {
  }

  onLoggedOut() {
    console.log('logging out...');
    this.authSession.destroy();

    this.router.navigate(['/login']);
  }

}