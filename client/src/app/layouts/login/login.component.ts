import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  form = {
    username: '',
    password: ''
  }

  errorMessage : any = null;

  constructor(private router: Router, private auth: AuthService) { }

  ngOnInit() { }

  onLoggedin() {
    const self = this;

    this.auth.login(this.form.username, this.form.password)
      .subscribe((data) => {
          if (data) {
            console.log('logged in, redirecting to main: ', data);
            self.router.navigate(['/main']);
          } else {
            self.errorMessage = 'Error logging in.';
          }
        })
  }

}
