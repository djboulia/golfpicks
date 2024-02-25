import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 * This translates between the ISO date string we use for dates and the ngBStruct item
 */
@Injectable()
export class CustomAdapter extends NgbDateAdapter<string> {
  fromModel(value: string | null): NgbDateStruct | null {
    if (value) {
      const date = new Date(value);
      const dateStruct = {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };

      // console.log('fromModel date: ', dateStruct);
      return dateStruct;
    }
    return null;
  }

  toModel(date: NgbDateStruct | null): string | null {
    const theDate = date ? new Date(date.year, date.month - 1, date.day) : null;
    // console.log('toModel date: ', (theDate) ? theDate.toISOString() : null);
    return theDate ? theDate.toISOString() : null;
  }
}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 * this implements a mm-yy-dddd format
 */
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  readonly DELIMITER = '-';

  parse(value: string): NgbDateStruct | null {
    if (value) {
      const date = value.split(this.DELIMITER);

      const dateStruct = {
        month: parseInt(date[0], 10),
        day: parseInt(date[1], 10),
        year: parseInt(date[2], 10),
      };

      // console.log('parsed date: ', dateStruct);
      return dateStruct;
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    const result = date ? date.month + this.DELIMITER + date.day + this.DELIMITER + date.year : '';
    // console.log('format date:' , result);
    return result;
  }
}
