import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthSessionService } from '../../../services/auth/auth-session.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemTwoComponent],
})
export class UserDropdownComponent {
  isOpen = false;
  name = '';

  constructor(
    private router: Router,
    private authSession: AuthSessionService,
  ) {
    this.name = this.authSession.getName();

    // add a listener to update for any changes
    this.authSession.authChange.subscribe(() => {
      this.name = this.authSession.getName();
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  onLoggedOut() {
    console.log('logging out...');
    this.authSession.destroy();

    this.router.navigate(['/login']);
  }
}
