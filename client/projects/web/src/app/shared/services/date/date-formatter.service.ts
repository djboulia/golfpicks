import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatterService {

  constructor() { }

  /**
   * Pretty print the tournament start and end dates
   * 
   * @param strDateStart string starting date
   * @param strDateEnd string ending date
   * @returns string formatted result
   */
   formatDateRange(strDateStart: string, strDateEnd : string): string {
    const start = new Date(strDateStart);
    const end = new Date(strDateEnd);

    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });

    return startMonth + ' ' + start.getDate() + '-' + endMonth + ' ' + end.getDate() + ', ' + end.getFullYear();
  }

  formatDate(strDate: string): string {
    const date = new Date(strDate);
    return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear();
  }
}
