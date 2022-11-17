import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameDayService {

  constructor() { }

  private endOfDay(timems: number): number {
    // convert timems to end of the current day.
    // this will give us a grace period for comparisons
    const eod = new Date(timems);

    eod.setHours(23, 59, 59, 999);

    return eod.getTime();
  };

  private dateTimeString(theDate: number): string {
    return this.dateString(theDate) + " " + this.timeString(theDate);
  }

  dateString(theDate: number): string {
    const months = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];

    const dateObj = new Date(theDate);

    return this.dayOfWeekString(theDate) + ", " +
      months[dateObj.getMonth()] + " " + dateObj.getDate();
  }

  dayOfWeekString(theDate: number): string {
    // return day of Week
    const days = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];

    const dateObj = new Date(theDate);

    return days[dateObj.getDay()];
  }

  timeString(theDate: number): string {
    const dateObj = new Date(theDate);

    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    const strTime = hours + ':' + minutesStr + ' ' + ampm;
    return strTime;
  }

  tournamentComplete(startString: string, endString: string): boolean {
    const start = new Date(startString).getTime();
    let end = new Date(endString).getTime();
    
    // set "end" to be the end of the current day before we do a
    // comparison.  this will give us a grace period for the
    // ending of tournament to be at midnight of the final day
    end = this.endOfDay(end);

    console.log("tournamentComplete: start " + start + ", ending " + end);

    return end < Date.now();
  }

  tournamentInProgress(startString: string, endString: string): boolean {
    console.log(`start: ${startString}, end: ${endString}`);

    const start = new Date(startString).getTime();
    let end = new Date(endString).getTime();
    const now = Date.now();

    // bump end date to end of the current day before comparing
    end = this.endOfDay(end);

    console.log("tournamentInProgress: start: " + this.dateTimeString(start)
      + " end: " + this.dateTimeString(end)
      + " now: " + this.dateTimeString(now));

    return (now > start) && (now < end);
  }

  // getGameDetails
  // build out relevent game information
  //
  // gameDetails = 
  // 		event   : name of the tournament
  // 		eventid : unique identifier for this tournamnent
  // 		start   : tournament start time 
  // 		end	    : tournament end time
  //
  //
  getGameDetails(game: any) {
    const gameDetails = {
      event: game.attributes.name,
      eventid: game.id,
      start: (game.attributes.start) ? Date.parse(game.attributes.start) : null,
      end: (game.attributes.end) ? Date.parse(game.attributes.end) : null
    };

    return gameDetails;
  }

  // at the specified number of hours to the event start time
  // add a grace period of 10 hours, e.g. 10AM EDT of the following day
  addGracePeriod(gameDetails: any, hours: number) {

    if (gameDetails.start) {
      const graceperiod = 1000 * 60 * 60 * hours; // hours in milliseconds

      gameDetails.start += graceperiod;
    }

    return gameDetails;
  }
}
