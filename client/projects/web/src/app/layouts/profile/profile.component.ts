import { Component, OnInit } from '@angular/core';
import { Gamer } from '../../shared/services/backend/gamer.interfaces';
import { GamerService } from '../../shared/services/backend/gamer.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: Gamer;

  errorMessage: any = null;
  infoMessage: any = null;

  isLoaded = false;

  constructor(
    private apiGamer: GamerService,
    private auth: AuthService,
    private router: Router,
  ) {
    this.user = apiGamer.newModel(); // initialize with empty gamer until we load
  }

  ngOnInit(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.errorMessage = null;
    this.infoMessage = null;

    this.apiGamer.currentUser().subscribe({
      next(gamer) {
        console.log('data ', gamer);

        self.user = gamer;

        self.isLoaded = true;
      },
      error(msg) {
        console.log('error getting current user!! ', msg);
        self.errorMessage = 'Error getting current user!';
        self.isLoaded = false;
      },
    });
  }

  onSave() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const gamer: Gamer = {
      id: this.user.id,
      admin: this.user.admin,
      name: this.user.name,
      username: this.user.username,
      password: this.user.password,
    };

    this.apiGamer.put(gamer).subscribe({
      next(data) {
        console.log('user data saved: ', data);
        self.infoMessage = 'User data saved.';

        // update the logged in user with the changes
        self.auth.refresh().subscribe(() => {
          console.log('refreshed user info');
          // self.router.navigate(['/main']);
        });
      },
      error(msg) {
        console.log('error saving data! ', msg);
        self.errorMessage = 'Error saving user data!';
      },
    });
  }
}
