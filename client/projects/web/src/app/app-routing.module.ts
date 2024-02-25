import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './shared/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/component/gamehistory', pathMatch: 'full' },
      {
        path: 'about',
        loadChildren: () => import('./layouts/about/about.module').then((m) => m.AboutModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('./layouts/profile/profile.module').then((m) => m.ProfileModule),
      },
      {
        path: 'component',
        loadChildren: () => import('./component/component.module').then((m) => m.ComponentsModule),
      },
    ],
  },
  {
    path: 'login',
    loadChildren: () => import('./layouts/login/login.module').then((m) => m.LoginModule),
  },
  {
    path: '**',
    redirectTo: '/component/gamehistory',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
