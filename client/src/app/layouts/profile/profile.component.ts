import { Component, OnInit } from '@angular/core';
import { Gamer } from 'src/app/shared/services/backend/gamer.interfaces';
import { GamerService } from 'src/app/shared/services/backend/gamer.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: any;

  form: any = {
    name: null,
    userid: null,
    password: null
  }

  errorMessage: any = null;
  infoMessage: any = null;

  isLoaded = false;

  constructor(private api: GamerService, private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    const self = this;

    this.errorMessage = null;
    this.infoMessage = null;

    this.api.currentUser()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.user = data;

          self.form.name = data.attributes.name;
          self.form.userid = data.attributes.username;
          self.form.password = data.attributes.password;
          self.isLoaded = true;
        },
        error(msg) {
          console.log('error getting current user!! ', msg);
          self.errorMessage = "Error getting current user!";
          self.isLoaded = false;
        }
      });
  }

  onSave() {

    const self = this;

    const gamer: Gamer = {
      id: this.user.id,
      className: this.user.className,
      attributes: {
        admin: this.user.attributes.admin,
        name: this.form.name,
        username: this.form.userid,
        password: this.form.password
      }
    }

    this.api.put(gamer)
      .subscribe({
        next(data) {
          console.log('user data saved: ', data);
          self.infoMessage = "User data saved.";

          // update the logged in user with the changes
          self.auth.refresh()
            .subscribe(() => {
              console.log('refreshed user info');
              // self.router.navigate(['/main']);        
            })
        },
        error(msg) {
          console.log('error saving data! ', msg);
          self.errorMessage = "Error saving user data!";
        }
      });
  }

}
