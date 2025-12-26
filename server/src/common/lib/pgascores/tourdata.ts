//
// wrapper the tourdata REST interface.  this provides rankings and
// tour schedule information as an alternative to going straight to
// the PGA or golf channel sites
//
import { JsonRequest } from './jsonrequest.js';
import { ConfigService } from '@nestjs/config';

export type Course = {
  name: string;
  par: number;
  date: string;
};

export type TourEventRound = {
  course: Course;
  date: string;
};

export type TourEventScore = {
  name: string;
  rank: string;
  thru: string;
  player_id: string;
  total: string;
  strokes: string;
  today: string;
  pos: string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
};

export type TourEvent = {
  start: string;
  provider: string;
  tournament_id: number;
  season: string;
  scores: TourEventScore[];

  rounds: TourEventRound[];
};

export type Ranking = {
  player_id: string;
  name: string;
  rank: string;
};

export type TourStop = {
  tournament: string;
  startDate: string;
  endDate: string;
  courses: string[];
  location: string;
  link: {
    href: string;
  };
};

export type TourSchedule = {
  schedule: TourStop[];
};

const getBaseUrl = function (configService: ConfigService) {
  const url = configService.get<string>('TOURDATA_URL');

  if (!url) {
    console.log('TOURDATA_URL environment variable not found!');
  }

  return url;
};

export class TourData {
  year: number;

  constructor(
    private readonly configService: ConfigService,
    year: number,
  ) {
    this.year = year;
  }

  private getRankingsUrl() {
    const url =
      getBaseUrl(this.configService) +
      '/rankings/search?tour=pga&year=' +
      this.year;
    return url;
  }

  private getEventUrl(id: string) {
    const url =
      getBaseUrl(this.configService) +
      '/tournaments/' +
      this.year +
      '/tour/pga/event/' +
      id +
      '?details=true';
    return url;
  }

  private getScheduleUrl() {
    const url =
      getBaseUrl(this.configService) +
      '/tournaments/search?tour=pga&year=' +
      this.year;
    return url;
  }

  async getRankings(): Promise<Ranking[]> {
    const url = this.getRankingsUrl();
    console.log('url : ' + url);

    const request = new JsonRequest(url);
    const json = await request.get().catch((e) => {
      console.log('Error retrieving url ' + url);
      throw e;
    });

    return json as Ranking[];
  }

  async getEvent(id: string): Promise<TourEvent> {
    const url = this.getEventUrl(id);
    console.log('event url : ' + url);

    const request = new JsonRequest(url);
    const json = await request.get().catch((e) => {
      console.log('Error retrieving url ' + url);
      throw e;
    });

    return json as TourEvent;
  }

  async getSchedule() {
    const url = this.getScheduleUrl();
    console.log('url : ' + url);

    const request = new JsonRequest(url);
    const json = await request.get().catch((e) => {
      console.log('Error retrieving url ' + url);
      throw e;
    });

    return json as TourSchedule;
  }
}
