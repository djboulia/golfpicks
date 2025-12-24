import { PickDto } from './pick.dto';

export class GamePlayerDetailsDto {
  name: string;
  objectId: string;
  user: {
    id: string;
    name: string;
  };
  picks: PickDto[];
  totals: string[];
  rounds: { score: string; leader: boolean }[];
  scores: string[];
}
