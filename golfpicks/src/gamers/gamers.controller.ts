import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Session,
} from '@nestjs/common';
import { GamersService } from './gamers.service';
import { LoginDto } from './dto/login.dto';
import { CreateGamerDto } from './dto/create-gamer.dto';
import { UpdateGamerDto } from './dto/update-gamer.dto';
import { GamesService } from 'src/games/games.service';

@Controller('gamers')
export class GamersController {
  constructor(
    private readonly gamersService: GamersService,
    private readonly gamesService: GamesService,
  ) {}

  @Post()
  create(@Body() createGamerDto: CreateGamerDto) {
    return this.gamersService.create(createGamerDto);
  }

  @Get()
  findAll() {
    return this.gamersService.findAll();
  }

  @Get('currentUser')
  currentUser(@Session() session: Record<string, any>) {
    return this.gamersService.currentUser(session);
  }

  @Post('login')
  login(@Session() session: Record<string, any>, @Body() loginDto: LoginDto) {
    return this.gamersService.login(session, loginDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamersService.findOne(id);
  }

  @Get(':id/games')
  games(@Param('id') id: string) {
    return this.gamersService.games(this.gamesService, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGamerDto: UpdateGamerDto) {
    return this.gamersService.update(id, updateGamerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gamersService.remove(id);
  }
}
