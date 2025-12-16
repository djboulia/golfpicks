import { environment } from '../../../../environments/environment';

export function ConfigBaseUrl(): string {
  return environment.apiUrl;
}
