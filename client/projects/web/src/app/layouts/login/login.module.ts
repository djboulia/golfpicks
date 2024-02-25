import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Login',
      urls: [{ title: 'Login', url: '/login' }, { title: 'Login' }],
    },
    component: LoginComponent,
  },
];

@NgModule({
  declarations: [LoginComponent],
  imports: [RouterModule.forChild(routes), CommonModule, FormsModule, NgbModule],
})
export class LoginModule {}
