import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { LoginFormComponent } from '../../../shared/components/auth/login-form/login-form.component';

@Component({
  selector: 'app-login',
  imports: [AuthPageLayoutComponent, LoginFormComponent],
  templateUrl: './login.component.html',
  styles: ``,
})
export class LoginComponent {}
