import { Module } from '@nestjs/common';
import { GamersService } from './gamers.service';
import { GamersController } from './gamers.controller';
import { GamesService } from 'src/games/games.service';

@Module({
  controllers: [GamersController],
  providers: [GamersService, GamesService],
})
export class GamersModule {}
