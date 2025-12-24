import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { EventsService } from 'src/events/events.service';
import { GamersService } from 'src/gamers/gamers.service';

@Module({
  controllers: [GamesController],
  providers: [GamesService, EventsService, GamersService],
})
export class GamesModule {}
