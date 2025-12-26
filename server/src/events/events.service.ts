import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GolfPicksDb } from 'src/common/db/golf-picks-db';
import { ConfigService } from '@nestjs/config';
import { CoursesService } from 'src/courses/courses.service';
import { formatNetScore, getLiveScores } from 'src/common/lib/scores';
import {
  getCourses,
  getGolfers,
  getPlayers,
  Golfer,
  sortByRank,
  tournamentLeaders,
} from 'src/common/lib/eventutils';
import {
  getCurrentRound,
  getCurrentRoundInProgress,
  getRounds,
  getRoundTitles,
  roundLeaders,
} from 'src/common/lib/rounds';
import { GamersService } from 'src/gamers/gamers.service';
import { TourData } from 'src/common/lib/pgascores/tourdata';
import { TourStopDto } from './dto/tour-stop.dto';
import { roundStatus } from 'src/common/lib/rounds';
import { EventDetailsDto } from './dto/event-details.dto';
import { comparePosition } from 'src/common/lib/compares';

const TABLE_NAME = 'golfpicks-pwcc';
const MODEL_NAME = 'Event';

export type RoundInfo = {
  currentRound: number;
  roundTitles: string[];
};

@Injectable()
export class EventsService {
  private golfPicksDb: GolfPicksDb;

  constructor(private readonly configService: ConfigService) {
    this.golfPicksDb = new GolfPicksDb(configService, TABLE_NAME);
  }

  create(createEventDto: CreateEventDto) {
    return this.golfPicksDb.create(
      MODEL_NAME,
      createEventDto,
    ) as Promise<UpdateEventDto>;
  }

  findAll() {
    return this.golfPicksDb.findAll(MODEL_NAME) as Promise<UpdateEventDto[]>;
  }

  findOne(id: string) {
    return this.golfPicksDb.findById(MODEL_NAME, id) as Promise<UpdateEventDto>;
  }

  update(id: string, updateEventDto: UpdateEventDto): Promise<UpdateEventDto> {
    return this.golfPicksDb.put(MODEL_NAME, {
      ...updateEventDto,
      id: id,
    }) as Promise<UpdateEventDto>;
  }

  remove(id: string) {
    return this.golfPicksDb.deleteById(MODEL_NAME, id);
  }

  async scores(coursesService: CoursesService, id: string) {
    console.log('getting scores for event ' + id);

    const event = await this.findOne(id).catch(() => {
      const str = 'Could not find event id ' + id;
      console.error(str);
      throw new Error(str);
    });

    console.log('called showScore for id ' + id);

    let courseid: string;

    if (event.rounds && event.rounds.length > 0) {
      // use the first day's course as the course for all rounds
      courseid = event.rounds[0].course;
    } else {
      const str = 'Invalid event object. No round info found!';

      console.error(str);
      throw new Error(str);
    }

    console.log('finding course ' + courseid);

    // find the course information
    const courserecord = await coursesService.findOne(courseid).catch((err) => {
      console.error(
        'Error!' +
          JSON.stringify(err) +
          ' courserecord ' +
          JSON.stringify(courserecord),
      );
      throw err;
    });

    // call the scoring service
    const result = await getLiveScores(this.configService, event).catch(
      (err) => {
        console.error('Error!' + JSON.stringify(err));
        throw err;
      },
    );

    return result;
  }

  async weather(coursesService: CoursesService, id: string) {
    console.log('getting weather for event ' + id);

    const event = await this.findOne(id).catch(() => {
      const str = 'Could not find event id ' + id;
      console.error(str);
      throw new Error(str);
    });

    console.log('found id ' + id);

    let courseid: string;

    if (event.rounds && event.rounds.length > 0) {
      // use the first day's course as the course for all rounds
      courseid = event.rounds[0].course;
    } else {
      const str = 'Invalid event object. No round info found!';

      console.error(str);
      throw new Error(str);
    }

    console.log('finding course ' + courseid);

    // find the course information
    const result = await coursesService.getWeather(courseid).catch(() => {
      const str = 'No location info for course ' + courseid;
      console.error(str);
      throw new Error(str);
    });

    return result;
  }

  /**
   * Do a deep get for this event where we fill in player and
   * course information
   *
   * @param {String} id event id
   * @param {String} playerSort optional - valid values: ranking
   * @returns
   */
  async deepGet(
    gamersService: GamersService,
    coursesService: CoursesService,
    id: string,
    playerSort?: string,
  ) {
    // default sort is by tournament position.  if playerSort is
    // equal to 'ranking', we will sort based on world golf ranking
    // for the players in the field
    const sortByRanking =
      playerSort && playerSort.toLowerCase() === 'ranking' ? true : false;
    console.log('sortByRanking = ', sortByRanking);

    const baseEvent = await this.findOne(id).catch(() => {
      const str = 'Could not find event id ' + id;
      console.error(str);
      throw new Error(str);
    });

    console.log('found id ' + id);

    const event: EventDetailsDto = { ...baseEvent };

    // do a deep get for player info
    event.players = await getPlayers(gamersService, event).catch((e) => {
      throw e;
    });

    // do a deep get for course info
    event.rounds = await getRounds(coursesService, event).catch((e) => {
      throw e;
    });

    const courseInfo = getCourses(event);
    const roundInfo = {
      currentRound: getCurrentRound(courseInfo),
      roundTitles: getRoundTitles(courseInfo),
    };

    // console.log('roundInfo ', roundInfo);

    // console.debug("entering loadEventData courseInfo :" + JSON.stringify(courseInfo));

    console.log('scoreType = ' + event.scoreType);

    // There are multiple types of scoring systems
    // For non PGA events, the scores are contained directly in
    // the event record.  For PGA events, we need to load the
    // live scoring data from the tour site

    if (event.scoreType == 'pga-live-scoring') {
      // go get the golfer scores from the remote service
      const tournament = await this.scores(coursesService, id).catch(() => {
        const str = 'Could not get scores for event id ' + id;
        console.error(str);
        throw new Error(str);
      });

      // console.debug("loadEventData courseInfo :" + JSON.stringify(courseInfo));

      event.golfers = tournament.scores;
      event.courseInfo = courseInfo;
      event.roundInfo = roundInfo;

      if (sortByRanking) {
        sortByRank(event.golfers);

        for (let i = 0; i < event.golfers.length; i++) {
          event.golfers[i].index = i + 1;
        }
      }
    } else {
      // match up scores and players
      const golfers = getGolfers(event);

      event.golfers = golfers;
      event.courseInfo = courseInfo;
      event.roundInfo = roundInfo;
    }

    return event;
  }

  /**
   * Return a newsfeed for this event. Consists of the tournament leader
   * and any current round leaders
   *
   * @param {String} id event id
   * @returns
   */
  async newsfeed(
    gamersService: GamersService,
    coursesService: CoursesService,
    id: string,
  ) {
    const event = await this.deepGet(gamersService, coursesService, id).catch(
      () => {
        const str = 'Could not find event id ' + id;
        console.error(str);
        throw new Error(str);
      },
    );

    const golfers = event.golfers ? event.golfers : [];
    const courseInfo = event.courseInfo ? event.courseInfo : [];

    console.log('found event id ' + id);

    const feedItems: string[] = [];
    const currentRound = getCurrentRoundInProgress(
      golfers,
      event.rounds.length,
    );

    if (currentRound > 0) {
      // var totalPar = 0;

      // for (var i = 0; i < currentRound; i++) {
      //     totalPar += courseInfo[i].par;
      // }

      // console.debug("total par: " + totalPar + ", currentRound: " + currentRound);
      // console.debug(JSON.stringify(golfers));

      if (event.scoreType == 'pga-live-scoring') {
        // First entry is the tournament leader; return this and all ties
        //                                    var score = golfers[0].strokes;
        //                                    var netScore = score - totalPar;

        const leaders = tournamentLeaders(golfers);
        const text =
          leaders.length > 1 ? 'Tournament leaders' : 'Tournament leader';

        feedItems.push(text);

        for (let i = 0; i < leaders.length; i++) {
          const leader = leaders[i];

          feedItems.push(leader.name + ' ' + leader.total);
        }

        const rndLeaders = roundLeaders(golfers, courseInfo);
        console.log('roundLeaders: ' + JSON.stringify(rndLeaders));

        if (rndLeaders[currentRound - 1].length > 0) {
          const leaders = rndLeaders[currentRound - 1];

          const text = 'Day ' + currentRound + ' low scores';

          feedItems.push(text);

          for (let i = 0; i < leaders.length; i++) {
            const leader = leaders[i];

            feedItems.push(leader.name + ' ' + leader.score);
          }
        }
      }
    }

    return feedItems;
  }

  /**
   * Return a sorted list of golfers for this event ordered
   * from the first to last.
   *
   * @param {String} id event id
   * @returns
   */
  async leaders(
    gamersService: GamersService,
    coursesService: CoursesService,
    id: string,
  ) {
    const event = await this.deepGet(gamersService, coursesService, id).catch(
      () => {
        const str = 'Could not find event id ' + id;
        console.error(str);
        throw new Error(str);
      },
    );

    const golfers = event.golfers ? event.golfers : [];
    const courseInfo = event.courseInfo ? event.courseInfo : [];

    console.log('found event id ' + id);

    const rndStatus = roundStatus(golfers, event.rounds.length);
    const roundNumbers: string[] = [];
    const lowRounds = [];

    for (let i = 0; i < courseInfo.length; i++) {
      roundNumbers.push((i + 1).toString());
      lowRounds[(i + 1).toString()] = '-';
    }

    console.log('roundStatus = ' + JSON.stringify(rndStatus, null, 2));

    // find last played round, walking backwards
    let currentRound = -1;

    for (let i = rndStatus.length - 1; i >= 0; i--) {
      if (rndStatus[i]) {
        currentRound = i;
        break;
      }
    }

    //                        console.log("current round = " + currentRound);
    //                        console.log("golfers before = " + JSON.stringify(golfers, null, 2));

    if (currentRound >= 0) {
      // store low score for each round of the tournament
      const leaders = roundLeaders(golfers, courseInfo);

      for (let i = 0; i <= currentRound; i++) {
        const roundNumber = (i + 1).toString();

        if (i == currentRound) {
          lowRounds[roundNumber] = leaders[i][0] ? leaders[i][0].score : '-';

          // loop through the current day scores and convert to net par
          // this makes in progress rounds format more nicely

          for (let g = 0; g < golfers.length; g++) {
            const golfer = golfers[g];

            if (golfer['today'] != '-') {
              golfer[roundNumber] = golfer['today'];
            }
          }
        } else {
          // sort lowest round total
          golfers.sort(function (a: Golfer, b: Golfer) {
            const aScore = a[roundNumber] as number;
            const bScore = b[roundNumber] as number;

            if (isNaN(aScore)) {
              return 1;
            } else if (isNaN(bScore)) {
              return -1;
            }

            return aScore - bScore;
          });

          // first element is low score
          lowRounds[roundNumber] = golfers[0][roundNumber] as number;
        }
      }

      //                            console.log("golfers after = " + JSON.stringify(golfers, null, 2));

      // TODO: fix for non PGA case
      // modify totals to be relative to par
      const isPGA = true;
      if (!isPGA) {
        // find lowest totals
        golfers.sort(function (a, b) {
          if (a.total == b.total) {
            return 0;
          } else if (a.total == '-') {
            return 1;
          } else if (b.total == '-') {
            return -1;
          } else {
            return parseInt(a.strokes) - parseInt(b.strokes);
          }
        });

        let totalPar = 0;

        for (let i = 0; i <= currentRound; i++) {
          totalPar += courseInfo[i].par;
        }

        for (let i = 0; i < golfers.length; i++) {
          const golfer = golfers[i];

          golfer.total = formatNetScore(parseInt(golfer.total) - totalPar);
        }
      } else {
        // console.debug('Golfers: ' + JSON.stringify(golfers));

        // sort by position
        golfers.sort(function (a, b) {
          return comparePosition(a.pos, b.pos);
        });

        //                            golfers.sort(function (a, b) {
        //                                var aTotal = eventUtils.parseNetScore(a.total);
        //                                var bTotal = eventUtils.parseNetScore(b.total);
        //
        //                                if (aTotal == bTotal) {
        //                                    return 0;
        //                                } else if (!eventUtils.isValidNetScore(a.total)) {
        //                                    return 1;
        //                                } else if (!eventUtils.isValidNetScore(b.total)) {
        //                                    return -1;
        //                                } else {
        //                                    return aTotal - bTotal;
        //                                }
        //                            });
      }
    }

    return {
      name: event.name,
      courseInfo: courseInfo,
      golfers: golfers,
      roundNumbers: roundNumbers,
      lowRounds: lowRounds,
    };
  }

  async tourSchedule(year: number) {
    console.log('found year ', year);
    const tourData = new TourData(this.configService, year);
    const result = await tourData.getSchedule();

    const schedule = result.schedule;

    // console.log('found schedule', schedule);

    const events: TourStopDto[] = [];

    for (let i = 0; i < schedule.length; i++) {
      const event = schedule[i];
      console.log(' found event ', event);

      // should be in the format /{year}/tour/pga/event/{id}
      const hrefParts = event.link.href.split('/');

      events.push({
        name: event.tournament,
        start: event.startDate,
        end: event.endDate,
        courses: event.courses,
        provider: 'tourData',
        year: hrefParts[1],
        tournament_id: hrefParts[5],
      });
    }

    return events;
  }
}
