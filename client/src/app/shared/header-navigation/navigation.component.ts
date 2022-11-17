import { Component, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

declare var $: any;

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent implements AfterViewInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  public config: PerfectScrollbarConfigInterface = {};

  public showSearch = false;

  public name : string;

  constructor(private router: Router, private auth: AuthService, private modalService: NgbModal) {
    this.name = auth.getName();

    // add a listener to update for any changes
    auth.authChange
      .subscribe((data) => {
        this.name = auth.getName();
      });
  }

  ngAfterViewInit() {
   }

  onLoggedOut() {
    console.log('logging out...');
    this.auth.logout();

    this.router.navigate(['/login']);
  }

}