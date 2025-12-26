import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PickDto } from './dto/pick.dto';
import { GamersService } from 'src/gamers/gamers.service';
import { CoursesService } from 'src/courses/courses.service';
import { EventsService } from 'src/events/events.service';

@Controller('api/games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gamersService: GamersService,
    private readonly coursesService: CoursesService,
    private readonly eventsService: EventsService,
  ) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.create(createGameDto);
  }

  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Get(':id/Gamers')
  gamers(@Param('id') id: string) {
    return this.gamesService.gamers(id);
  }

  @Get(':id/gamerDetails')
  gamerDetails(@Param('id') id: string) {
    return this.gamesService.gamerDetails(this.gamersService, id);
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string) {
    return this.gamesService.leaderboard(
      this.gamersService,
      this.coursesService,
      this.eventsService,
      id,
    );
  }

  @Get(':id/gameDay')
  gameDay(@Param('id') id: string) {
    return this.gamesService.gameDay(id);
  }

  @Get(':id/Gamers/:gamerid/picks')
  getPicks(@Param('id') id: string, @Param('gamerid') gamerid: string) {
    return this.gamesService.getGamerPicks(id, gamerid);
  }

  @Post(':id/Gamers/:gamerid/picks')
  putPicks(
    @Param('id') id: string,
    @Param('gamerid') gamerid: string,
    @Body() picksDto: PickDto[],
  ) {
    return this.gamesService.updateGamerPicks(id, gamerid, picksDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
    return this.gamesService.update(id, updateGameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
