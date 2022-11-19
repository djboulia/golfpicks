
import { DateHelperService } from "../date/date-helper.service";

export class GameDayService {

  private start: DateHelperService ;
  private end: DateHelperService;

  constructor(private game: any) {
    const startDate = (game.attributes.start) ? Date.parse(game.attributes.start) : null;
    const endDate = (game.attributes.end) ? Date.parse(game.attributes.end) : null;

  
    this.start = new DateHelperService(startDate);
    this.end = new DateHelperService(endDate);
  }

  getName(): string {
    return this.game.attributes.name;
  }

  getId(): string {
    return this.game.id;
  }

  getStart(): string {
    return this.start.dateString();
  }

  getEnd(): string {
    return this.end.dateString();
  }

  getEventId() : string {
    return this.game.attributes.event;
  }

  getGamers() : any[] {
    return this.game.attributes.gamers;
  }

  tournamentComplete(): boolean {

    const end = this.end;
    const start = this.start;

    // set "end" to be the end of the current day before we do a
    // comparison.  this will give us a grace period for the
    // ending of tournament to be at midnight of the final day
    const endOfDay = end.endOfDay();

    console.log("tournamentComplete: start " + start.get() + ", ending " + end.get());

    return endOfDay < Date.now();
  }

  tournamentInProgress(): boolean {
    const end = this.end;
    const start = this.start;

    console.log(`start: ${start.dateTimeString()}, end: ${end.dateTimeString()}`);

    const dateNow = new DateHelperService();

    // bump end date to end of the current day before comparing
    const dateEnd = new DateHelperService(end.endOfDay());

    console.log("tournamentInProgress: start: " + start.dateTimeString()
      + " end: " + dateEnd.dateTimeString()
      + " now: " + dateNow.dateTimeString());

    return (dateNow.get() > start.get()) && (dateNow.get() < dateEnd.get());
  }

  // add the specified number of hours to the event start time
  // add a grace period of 10 hours, e.g. 10AM EDT of the following day
  addGracePeriod(hours: number) {
    const start = this.start;
    const graceperiod = 1000 * 60 * 60 * hours; // hours in milliseconds

    this.start = new DateHelperService(start.get() + graceperiod);
  }
}
