import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CoursesService } from 'src/courses/courses.service';
import { GamersService } from 'src/gamers/gamers.service';

@Controller('api/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly coursesService: CoursesService,
    private readonly gamersService: GamersService,
  ) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/scores')
  scores(@Param('id') id: string) {
    return this.eventsService.scores(this.coursesService, id);
  }

  @Get(':id/weather')
  weather(@Param('id') id: string) {
    return this.eventsService.weather(this.coursesService, id);
  }

  @Get(':id/deep')
  deep(@Param('id') id: string, @Query('playerSort') playerSort?: string) {
    return this.eventsService.deepGet(
      this.gamersService,
      this.coursesService,
      id,
      playerSort,
    );
  }

  @Get(':id/newsfeed')
  newsfeed(@Param('id') id: string) {
    return this.eventsService.newsfeed(
      this.gamersService,
      this.coursesService,
      id,
    );
  }

  @Get(':id/leaders')
  leaders(@Param('id') id: string) {
    return this.eventsService.leaders(
      this.gamersService,
      this.coursesService,
      id,
    );
  }

  @Get('tour/pga/:year')
  pga(@Param('year') year: number) {
    return this.eventsService.tourSchedule(year);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
