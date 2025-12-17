import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UpdateProfileFormComponent } from '../../../shared/components/auth/update-profile-form/update-profile-form.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, PageBreadcrumbComponent, UpdateProfileFormComponent],
  templateUrl: './profile.component.html',
  styles: ``,
})
export class ProfileComponent {}
