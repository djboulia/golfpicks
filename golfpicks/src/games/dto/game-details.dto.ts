import { GamerDetailsDto } from 'src/gamers/dto/gamer-details.dto.';

export class GameDetailsDto {
  name: string;
  start: string;
  end: string;
  event: string;
  gameDay?: {
    inProgress: boolean;
    complete: boolean;
  };

  gamers: GamerDetailsDto[];
  notplaying: GamerDetailsDto[];
}
