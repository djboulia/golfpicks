import { PickDto } from 'src/games/dto/pick.dto';
import { CreateGamerDto } from './create-gamer.dto';

export class GamerDetailsDto extends CreateGamerDto {
  id?: string;
  user?: string;
  picks?: PickDto[];
}
