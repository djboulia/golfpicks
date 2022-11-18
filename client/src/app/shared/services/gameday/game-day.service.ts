
import { DateHelperService } from "../date/date-helper.service";

export class GameDayService {

  private gameDetails: any = null;

  constructor(private game: any) {
    this.gameDetails = this.getGameDetails(this.game);
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
  private getGameDetails(game: any) {
    const start = (game.attributes.start) ? Date.parse(game.attributes.start) : null;
    const end = (game.attributes.end) ? Date.parse(game.attributes.end) : null;

    const gameDetails = {
      event: game.attributes.name,
      eventid: game.id,
      start: new DateHelperService(start),
      end: new DateHelperService(end)
    };

    return gameDetails;
  }

  getName(): string {
    return this.gameDetails.event;
  }

  getStart(): string {
    const start = this.gameDetails.start;
    return start.dateString();
  }

  getEnd(): string {
    const end = this.gameDetails.end;
    return end.dateString();
  }

  tournamentComplete(): boolean {

    const end = this.gameDetails.end;
    const start = this.gameDetails.start;

    // set "end" to be the end of the current day before we do a
    // comparison.  this will give us a grace period for the
    // ending of tournament to be at midnight of the final day
    const endOfDay = end.endOfDay();

    console.log("tournamentComplete: start " + start.get() + ", ending " + end.get());

    return endOfDay < Date.now();
  }

  tournamentInProgress(): boolean {
    const end = this.gameDetails.end;
    const start = this.gameDetails.start;

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
    const start = this.gameDetails.start;
    const graceperiod = 1000 * 60 * 60 * hours; // hours in milliseconds

    this.gameDetails.start = new DateHelperService(start.get() + graceperiod);
  }
}
