import { DateHelperService } from '../date/date-helper.service';
import { GameDay } from './game.model';

export class GameDayService {
  private start: DateHelperService;
  private end: DateHelperService;

  constructor(private game: GameDay) {
    const startDate = game.start ? Date.parse(game.start) : null;
    const endDate = game.end ? Date.parse(game.end) : null;

    this.start = new DateHelperService(startDate);
    this.end = new DateHelperService(endDate);
  }

  getName(): string {
    return this.game.name;
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

  getEventId(): string {
    return this.game.event;
  }

  getGamers(): any[] {
    return this.game.gamers;
  }

  tournamentComplete(): boolean {
    return this.game.gameDay.complete;
  }

  tournamentInProgress(): boolean {
    return this.game.gameDay.inProgress;
  }
}
