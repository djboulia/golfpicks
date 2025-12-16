import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthGuard } from './app.guard';
import { AuthService } from './shared/services/auth/auth.service';
import { GamerService } from './shared/services/golfpicks/gamer.service';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    AuthService,
    GamerService,
    AuthGuard,
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};
