import { environment } from '../../../../environments/environment';

export function ConfigBaseUrl(): string {
  if (environment.production) {
    // in prod mode the client files will be served from the same host
    return '/api';
  } else {
    return 'http://localhost:3000/api';
  }
}
