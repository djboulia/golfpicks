import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-about',
  imports: [CommonModule, PageBreadcrumbComponent],
  templateUrl: './about.component.html',
  styles: ``,
})
export class AboutComponent {}
