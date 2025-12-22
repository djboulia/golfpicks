import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { Gamer } from '../../../services/golfpicks/gamer.model';
import { GamerService } from '../../../services/golfpicks/gamer.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-update-profile-form',
  imports: [
    CommonModule,
    LabelComponent,
    ButtonComponent,
    InputFieldComponent,
    ComponentCardComponent,
  ],
  templateUrl: './update-profile-form.component.html',
  styles: ``,
})
export class UpdateProfileFormComponent implements OnInit {
  user: Gamer;

  errorMessage: any = null;
  infoMessage: any = null;

  isLoaded = false;
  showPassword = false;

  constructor(
    private apiGamer: GamerService,
    private auth: AuthService,
  ) {
    this.user = apiGamer.newModel(); // initialize with empty gamer until we load
  }

  ngOnInit(): void {
    this.errorMessage = null;
    this.infoMessage = null;

    this.apiGamer.currentUser().subscribe({
      next: (gamer) => {
        console.log('data ', gamer);

        this.user = gamer;
        this.isLoaded = true;
      },
      error: (msg) => {
        console.log('error getting current user!! ', msg);
        this.errorMessage = 'Error getting current user!';
        this.isLoaded = false;
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onNameChange(newName: string | number) {
    if (typeof newName === 'number') {
      newName = newName.toString();
    }
    this.user.name = newName || '';
  }

  onEmailChange(newEmail: string | number) {
    if (typeof newEmail === 'number') {
      newEmail = newEmail.toString();
    }
    this.user.username = newEmail || '';
  }

  onPasswordChange(newPassword: string | number) {
    if (typeof newPassword === 'number') {
      newPassword = newPassword.toString();
    }
    this.user.password = newPassword || '';
  }

  onUpdate() {
    const gamer: Gamer = {
      id: this.user.id,
      admin: this.user.admin,
      name: this.user.name,
      username: this.user.username,
      password: this.user.password,
    };

    this.apiGamer.put(gamer).subscribe({
      next: (data) => {
        console.log('user data saved: ', data);
        this.infoMessage = 'User data saved.';

        // update the logged in user with the changes
        this.auth.refresh().subscribe(() => {
          console.log('refreshed user info');
        });
      },
      error: (msg) => {
        console.log('error saving data! ', msg);
        this.errorMessage = 'Error saving user data!';
      },
    });
  }
}
