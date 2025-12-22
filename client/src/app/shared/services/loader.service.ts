import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loading = false;
  private errorMessage: string | undefined = undefined;

  isLoading(): boolean {
    return this.loading;
  }

  hasError(): boolean {
    return this.errorMessage !== undefined;
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
    this.clearErrorMessage();
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.loading = false; // reset loading state when an error occurs
  }

  clearErrorMessage(): void {
    this.errorMessage = undefined;
  }
}
