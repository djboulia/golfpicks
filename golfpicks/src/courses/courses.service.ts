import { Injectable } from '@nestjs/common';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GolfPicksDb } from 'src/common/db/golf-picks-db';
import { ConfigService } from '@nestjs/config';
import { CreateCourseDto } from './dto/create-course.dto';
import { forecast } from 'src/common/lib/weather';
import { WeatherDto } from './dto/weather.dto';

const TABLE_NAME = 'golfpicks-internal-courses';
const MODEL_NAME = 'Course';

@Injectable()
export class CoursesService {
  private golfPicksDb: GolfPicksDb;

  constructor(private readonly configService: ConfigService) {
    this.golfPicksDb = new GolfPicksDb(configService, TABLE_NAME);
  }

  create(createCourseDto: CreateCourseDto) {
    return this.golfPicksDb.create(
      MODEL_NAME,
      createCourseDto,
    ) as Promise<UpdateCourseDto>;
  }

  findAll() {
    return this.golfPicksDb.findAll(MODEL_NAME) as Promise<UpdateCourseDto[]>;
  }

  findOne(id: string) {
    return this.golfPicksDb.findById(
      MODEL_NAME,
      id,
    ) as Promise<UpdateCourseDto>;
  }

  findByIds(ids: string[]) {
    return this.golfPicksDb.findByIds(MODEL_NAME, ids) as Promise<
      UpdateCourseDto[]
    >;
  }

  update(
    id: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<CreateCourseDto> {
    return this.golfPicksDb.put(MODEL_NAME, {
      ...updateCourseDto,
      id: id,
    }) as Promise<UpdateCourseDto>;
  }

  remove(id: string) {
    return this.golfPicksDb.deleteById(MODEL_NAME, id);
  }

  async getWeather(id: string) {
    console.log('getting weather for course ' + id);

    // find the course information
    const course = (await this.golfPicksDb.findById(
      MODEL_NAME,
      id,
    )) as UpdateCourseDto;
    if (!course) {
      const str = 'No course found for id ' + id;
      console.error(str);
      throw new Error(str);
    }

    // look for lat/long coordinates for this course
    if (!course.location || !course.location.lat || !course.location.lng) {
      const str = 'No location info for course ' + id;
      console.error(str);
      throw new Error(str);
    }

    const lat = course.location.lat;
    const lng = course.location.lng;

    const result = await forecast(Number(lat), Number(lng)).catch((e) => {
      console.error(
        'Weather call failed for course ' + id + ', lat=' + lat + ' lng=' + lng,
      );
      throw e;
    });

    console.log(
      'Found weather info for course ' + id + ', lat=' + lat + ' lng=' + lng,
    );
    return result as WeatherDto;
  }
}
