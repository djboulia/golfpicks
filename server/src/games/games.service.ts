import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

import { GolfPicksDb } from 'src/common/db/golf-picks-db';
import { ConfigService } from '@nestjs/config';
import { GamersService } from 'src/gamers/gamers.service';
import {
  addGracePeriod,
  getGameDetails,
  tournamentComplete,
  tournamentInProgress,
} from 'src/common/lib/gameutils';
import { compareScores } from 'src/common/lib/compares';
import { addRoundLeaders, expandPicks, getScores } from 'src/common/lib/picks';
import { EventsService, RoundInfo } from 'src/events/events.service';
import { CoursesService } from 'src/courses/courses.service';
import { roundStatus } from 'src/common/lib/rounds';
import { GamePlayerDto } from './dto/game-player.dto';
import { PickDto } from './dto/pick.dto';
import { GamePlayerDetailsDto } from './dto/game-player-details.dto';
import { Course } from 'src/common/lib/pgascores/tourdata';
import { GamerDetailsDto } from 'src/gamers/dto/gamer-details.dto.';
import { GameDetailsDto } from './dto/game-details.dto';

const TABLE_NAME = 'golfpicks-pwcc';
const MODEL_NAME = 'Game';

type Leaderboard = {
  name: string;
  courseInfo: Course[];
  roundInfo?: RoundInfo;
  gamers: GamePlayerDetailsDto[] | null;
};

@Injectable()
export class GamesService {
  private golfPicksDb: GolfPicksDb;

  constructor(private readonly configService: ConfigService) {
    this.golfPicksDb = new GolfPicksDb(configService, TABLE_NAME);
  }

  create(createGameDto: CreateGameDto) {
    return this.golfPicksDb.create(
      MODEL_NAME,
      createGameDto,
    ) as Promise<UpdateGameDto>;
  }

  findAll() {
    return this.golfPicksDb.findAll(MODEL_NAME) as Promise<UpdateGameDto[]>;
  }

  findOne(id: string) {
    return this.golfPicksDb.findById(MODEL_NAME, id) as Promise<UpdateGameDto>;
  }

  update(id: string, updateGameDto: UpdateGameDto): Promise<UpdateGameDto> {
    return this.golfPicksDb.put(MODEL_NAME, {
      ...updateGameDto,
      id: id,
    }) as Promise<UpdateGameDto>;
  }

  remove(id: string) {
    return this.golfPicksDb.deleteById(MODEL_NAME, id);
  }

  async gamerDetails(gamersService: GamersService, gameid: string) {
    console.log('getting gamer map for game ' + gameid);

    const game = (await this.findOne(gameid).catch(() => {
      const str = 'Could not find game id ' + gameid;
      console.error(str);
      throw new Error(str);
    })) as unknown as GameDetailsDto;

    if (!game) {
      throw new Error(`Game id ${gameid} not found`);
    }

    // now get all the player ids
    const gamerpicks = game.gamers || [];
    console.log('gamer picks:' + JSON.stringify(gamerpicks));

    const gamers = await gamersService.findAll().catch(() => {
      const str = 'Could not find gamers';
      console.error(str);
      throw new Error(str);
    });

    // merge the gamer pick data with the gamer record
    const mergedPicks: GamerDetailsDto[] = [];

    for (let i = 0; i < gamerpicks.length; i++) {
      for (let j = 0; j < gamers.length; j++) {
        if (gamerpicks[i].user === gamers[j].id) {
          const gamer: GamerDetailsDto = gamers[j];
          gamer.id = undefined; // redundant, user field has this
          gamer.user = gamerpicks[i].user;
          gamer.picks = gamerpicks[i].picks;

          mergedPicks.push(gamer);

          // remove this gamer from the gamers array
          gamers.splice(j, 1);
          break;
        }
      }
    }

    // the remaining gamers from the original gamers list are
    // those that are not playing in this game at present
    const notPlaying: GamerDetailsDto[] = [];
    for (let i = 0; i < gamers.length; i++) {
      const gamer: GamerDetailsDto = gamers[i];
      gamer.user = gamers[i].id;
      notPlaying.push(gamer);
    }

    game.gamers = mergedPicks;
    game.notplaying = notPlaying;

    return game;
  }

  async gamers(id: string) {
    console.log('getting gamers for game ' + id);

    const game = (await this.golfPicksDb.findById(MODEL_NAME, id).catch(() => {
      const str = 'Could not find game id ' + id;
      console.error(str);
      throw new Error(str);
    })) as CreateGameDto;

    if (!game.gamers) {
      const str = 'No gamers found in this game object!';

      console.error(str);
      throw new Error(str);
    }

    console.log('Found gamers: ' + JSON.stringify(game.gamers));

    return game.gamers;
  }

  async getGamerPicks(id: string, gamerid: string) {
    console.log('getting picks for game ' + id + ' and gamer ' + gamerid);

    const game = (await this.golfPicksDb.findById(MODEL_NAME, id).catch(() => {
      const str = 'Could not find game id ' + id;
      console.error(str);
      throw new Error(str);
    })) as CreateGameDto;

    if (!game.gamers) {
      const str = 'No picks found in this game object!';

      console.error(str);
      throw new Error(str);
    }

    const gamers = game.gamers;

    console.log('Found gamers: ' + JSON.stringify(gamers));

    for (let i = 0; i < gamers.length; i++) {
      const gamer = gamers[i];

      if (gamer.user == gamerid) {
        console.log('Found gamer: ' + JSON.stringify(gamer));

        return { picks: gamer.picks };
      }
    }

    const str = 'Picks for gamer id ' + gamerid + ' not found';
    console.error(str);
    throw new Error(str);
  }

  async updateGamerPicks(id: string, gamerid: string, picks: PickDto[]) {
    console.log(
      'updateGamerPicks: getting picks for game ' +
        id +
        ' and gamer ' +
        gamerid,
    );
    console.log('body contents: ' + JSON.stringify(picks));

    const game = (await this.golfPicksDb.findById(MODEL_NAME, id).catch(() => {
      const str = 'Could not find game id ' + id;
      console.error(str);
      throw new Error(str);
    })) as CreateGameDto;

    if (!game.gamers) {
      game.gamers = [];
    }

    const gamers = game.gamers;

    console.log('Found gamers: ' + JSON.stringify(gamers));

    // find the gamer to see if this is an update of existing picks
    let gamerEntry = -1;

    let i: number;
    for (i = 0; i < gamers.length; i++) {
      const gamer = gamers[i];

      if (gamer.user == gamerid) {
        console.log('Found gamer: ' + JSON.stringify(gamer));

        gamerEntry = i;
        break;
      }
    }

    if (gamerEntry < 0) {
      // no prior picks for this user, add this as a new entry
      console.log('Adding gamer picks for user: ' + gamerid);

      gamers.push({ user: gamerid, picks: picks });
    } else {
      gamers[i].picks = picks;
    }

    console.log('updating db with the following: ' + JSON.stringify(game));

    await this.golfPicksDb.put(MODEL_NAME, game).catch((e) => {
      console.error('Error!' + JSON.stringify(e));
      throw e;
    });

    console.log('update successful!');
    return { picks: game.gamers };
  }

  /**
   * return the leaderboard information
   *
   * @param {String} id event id
   * @returns
   */
  async leaderboard(
    gamersService: GamersService,
    coursesService: CoursesService,
    eventsService: EventsService,
    id: string,
  ) {
    const game = (await this.findOne(id).catch(() => {
      const str = 'Could not find game id ' + id;
      console.error(str);
      throw new Error(str);
    })) as CreateGameDto;

    const eventid = game.event;
    console.log(`found event ${eventid}for game ${id}`);

    const event = await eventsService
      .deepGet(gamersService, coursesService, eventid)
      .catch(() => {
        const str = 'Could not find event id ' + id;
        console.error(str);
        throw new Error(str);
      });

    console.log('found event id ' + eventid);

    const golfers = event.golfers || [];
    const courseInfo = event.courseInfo || [];
    const roundInfo = event.roundInfo;

    // console.log('loadLeaderboard: ', courseInfo);

    const gamers = game.gamers;
    const leaderboard: Leaderboard = {
      name: event.name,
      courseInfo: courseInfo,
      roundInfo: roundInfo,
      gamers: null,
    };

    if (gamers && gamers.length > 0) {
      const rndStatus = roundStatus(golfers, event.rounds.length);
      console.log('Rounds started: ' + JSON.stringify(rndStatus));

      const gamer_ids: string[] = [];

      if (!gamers)
        console.error('processLeaderboardData: invalid gamers object!');

      gamers.forEach(function (gamer) {
        const picks = gamer.picks || [];
        // console.debug("picks: " + JSON.stringify(gamer.picks));
        gamer.picks = expandPicks(picks, golfers) as unknown as PickDto[];
        gamer_ids.push(gamer.user);
      });

      // now go load the user info for each of the gamers

      const users = await gamersService.findByIds(gamer_ids).catch(() => {
        const str = 'Could not find gamer ids ' + JSON.stringify(gamer_ids);
        console.error(str);
        throw new Error(str);
      });

      const validgamers: GamePlayerDto[] = [];

      users.forEach(function (user) {
        gamers.forEach(function (gamer) {
          if (user.id == gamer.user) {
            //			  		alert("found match for " + object.objectId);
            gamer.user = user as unknown as string;

            // only keep those we can find a valid user object for...
            validgamers.push(gamer);
          }
        });
      });

      console.debug('validgamers: ' + JSON.stringify(validgamers));

      let expandedGamers = getScores(
        courseInfo,
        rndStatus,
        validgamers as unknown as GamePlayerDetailsDto[],
        event.scoreType,
      );
      expandedGamers = addRoundLeaders(expandedGamers);

      // sort the leaders by lowest score in current round
      // if there are ties, sort by previous rounds
      const currentRound = leaderboard?.roundInfo?.currentRound || 0;
      console.log('sorting gamers for round ', currentRound);
      expandedGamers?.sort((a, b) => {
        for (let i = currentRound; i >= 0; i--) {
          const result = compareScores(a.rounds[i]?.score, b.rounds[i]?.score);
          if (result !== 0) return result;
        }
        return 0;
      });

      // sort each gamer's picks by lowest score in current round
      for (const gamer of expandedGamers) {
        gamer.picks?.sort((a, b) => {
          for (let i = currentRound; i >= 0; i--) {
            const result = compareScores(a.rounds[i], b.rounds[i]);

            if (result !== 0) return result;
            // continue on looking at prior rounds if first round is a tie
          }
          return 0;
        });
      }

      leaderboard.gamers = expandedGamers;
    }

    return leaderboard;
  }

  /**
   * add game day specific information to the game record
   *
   * @param {string} id gameid
   */
  async gameDay(id: string) {
    console.log();
    const game = (await this.golfPicksDb.findById(MODEL_NAME, id).catch(() => {
      const str = 'Could not find game id ' + id;
      console.error(str);
      throw new Error(str);
    })) as CreateGameDto;

    if (!game) {
      throw new Error(`Game id ${id} not found`);
    }

    const gameDetails = getGameDetails(game, id);
    addGracePeriod(gameDetails, 10);

    // add tournament complete/inprogress stats
    const gameDay = {
      inProgress: tournamentInProgress(gameDetails.start, gameDetails.end),
      complete: tournamentComplete(gameDetails.start, gameDetails.end),
    };

    game.gameDay = gameDay;

    return game;
  }
}
