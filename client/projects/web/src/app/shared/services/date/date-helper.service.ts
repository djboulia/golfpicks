export class DateHelperService {
  theDate = Date.now();

  constructor( private date? : number | null ) { 
    // if date is supplised, use it. otherwise default
    // to current time
    if (date) {
      this.theDate = date;
    }
  }

  get(): number {
    return this.theDate;
  }

  endOfDay(): number {
    // convert timems to end of the current day.
    // this will give us a grace period for comparisons
    const eod = new Date(this.theDate);

    eod.setHours(23, 59, 59, 999);

    return eod.getTime();
  };

  dateTimeString(): string {
    return this.dateString() + " " + this.timeString();
  }

  dateString(): string {
    const months = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];

    const dateObj = new Date(this.theDate);

    return this.dayOfWeekString() + ", " +
      months[dateObj.getMonth()] + " " + dateObj.getDate();
  }

  dayOfWeekString(): string {
    // return day of Week
    const days = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];

    const dateObj = new Date(this.theDate);

    return days[dateObj.getDay()];
  }

  timeString(): string {
    const dateObj = new Date(this.theDate);

    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    const strTime = hours + ':' + minutesStr + ' ' + ampm;
    return strTime;
  }

}
