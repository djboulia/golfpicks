import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GolfPicksDb } from 'src/common/db/golf-picks-db';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

const TABLE_NAME = 'golfpicks-pwcc';
const MODEL_NAME = 'Log';

@Injectable()
export class LogsService {
  private golfPicksDb: GolfPicksDb;

  constructor(private readonly configService: ConfigService) {
    this.golfPicksDb = new GolfPicksDb(configService, TABLE_NAME);
  }

  create(createLogDto: CreateLogDto) {
    return this.golfPicksDb.create(
      MODEL_NAME,
      createLogDto,
    ) as Promise<UpdateLogDto>;
  }

  findAll() {
    return this.golfPicksDb.findAll(MODEL_NAME) as Promise<UpdateLogDto[]>;
  }

  findOne(id: string) {
    return this.golfPicksDb.findById(MODEL_NAME, id) as Promise<UpdateLogDto>;
  }

  update(id: string, updateLogDto: UpdateLogDto): Promise<UpdateLogDto> {
    return this.golfPicksDb.put(MODEL_NAME, {
      ...updateLogDto,
      id: id,
    }) as Promise<UpdateLogDto>;
  }

  remove(id: string) {
    return this.golfPicksDb.deleteById(MODEL_NAME, id);
  }
}
