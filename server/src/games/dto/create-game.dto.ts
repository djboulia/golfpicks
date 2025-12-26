import { GamePlayerDto } from './game-player.dto';

export class CreateGameDto {
  name: string;
  start: string;
  end: string;
  event: string;
  gamers?: GamePlayerDto[];
  gameDay?: {
    inProgress: boolean;
    complete: boolean;
  };
}
