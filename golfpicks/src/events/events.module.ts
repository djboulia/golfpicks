import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { GamersService } from 'src/gamers/gamers.service';
import { CoursesService } from 'src/courses/courses.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, GamersService, CoursesService],
})
export class EventsModule {}
