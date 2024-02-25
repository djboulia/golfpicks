import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './profile.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Profile',
      urls: [{ title: 'Profile', url: '/profile' }, { title: 'Profile' }],
    },
    component: ProfileComponent,
  },
];

@NgModule({
  declarations: [ProfileComponent],
  imports: [RouterModule.forChild(routes), CommonModule, FormsModule, NgbModule],
})
export class ProfileModule {}
