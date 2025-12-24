export class CreateEventDto {
  provider: string;
  name: string;
  start: string;
  end: string;
  season: string;
  tournament_id: string;
  scoreType: string;
  rounds: {
    date: string;
    course: string;
    scores?: { player: string; score: number }[];
  }[];
}
