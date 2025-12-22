import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login-form',
  imports: [
    CommonModule,
    LabelComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent {
  showPassword = false;
  errorMessage = '';

  email: string | number = '';
  password: string | number = '';

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    console.log('Email:', this.email);

    this.auth.login(this.email as string, this.password as string).subscribe((data) => {
      if (data) {
        console.log('logged in, redirecting to main page: ', data);
        this.router.navigate(['/']);
      } else {
        this.errorMessage = 'Error logging in. Please check your credentials and try again.';
      }
    });
  }
}
