import { Injectable } from '@nestjs/common';
import { CreateGamerDto } from './dto/create-gamer.dto';
import { UpdateGamerDto } from './dto/update-gamer.dto';
import { GolfPicksDb } from 'src/common/db/golf-picks-db';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import { GamesService } from 'src/games/games.service';
import {
  getGameDetails,
  addGracePeriod,
  tournamentComplete,
  tournamentInProgress,
} from 'src/common/lib/gameutils';

const TABLE_NAME = 'golfpicks-pwcc';
const MODEL_NAME = 'Gamer';

type GameHistory = {
  active: {
    inProgress: boolean;
    joined: boolean;
    event?: string;
    eventid?: string;
  };
  history: {
    event: string;
    eventid: string;
    start?: number | undefined;
    end?: number | undefined;
  }[];
};

@Injectable()
export class GamersService {
  private golfPicksDb: GolfPicksDb;

  constructor(private readonly configService: ConfigService) {
    this.golfPicksDb = new GolfPicksDb(configService, TABLE_NAME);
  }

  create(createLogDto: CreateGamerDto) {
    return this.golfPicksDb.create(
      MODEL_NAME,
      createLogDto,
    ) as Promise<UpdateGamerDto>;
  }

  findAll() {
    return this.golfPicksDb.findAll(MODEL_NAME) as Promise<UpdateGamerDto[]>;
  }

  findOne(id: string) {
    return this.golfPicksDb.findById(MODEL_NAME, id) as Promise<UpdateGamerDto>;
  }

  findByIds(ids: string[]) {
    return this.golfPicksDb.findByIds(MODEL_NAME, ids) as Promise<
      UpdateGamerDto[]
    >;
  }

  update(id: string, updateGamerDto: UpdateGamerDto): Promise<UpdateGamerDto> {
    return this.golfPicksDb.put(MODEL_NAME, {
      ...updateGamerDto,
      id: id,
    }) as Promise<UpdateGamerDto>;
  }

  remove(id: string) {
    return this.golfPicksDb.deleteById(MODEL_NAME, id);
  }

  async login(session: Record<string, any>, credentials: LoginDto) {
    const user = credentials.username;
    const password = credentials.password;

    console.log('logging in user ' + user);

    const gamers = await this.golfPicksDb
      .findByFields(MODEL_NAME, { username: user })
      .catch((err) => {
        throw err;
      });

    if (!gamers) {
      throw new Error('Invalid login');
    }

    let match: AttributeMap | undefined = undefined;

    for (let i = 0; i < gamers.length; i++) {
      const gamer = gamers[i];

      if (gamer.username == user && gamer.password == password) {
        match = gamer;
      }
    }

    if (match) {
      console.log('logged in user ' + user);
      session.user = match;

      return match;
    } else {
      session.user = undefined;
      throw new Error('Invalid login');
    }
  }

  async currentUser(session: Record<string, any>) {
    console.log('getting current user from session');
    const user = session.user as UpdateGamerDto | undefined;

    if (user) {
      console.log(`user is logged in: ${JSON.stringify(user)}`);
      const gamer = await this.golfPicksDb
        .findById(MODEL_NAME, user.id)
        .catch((err) => {
          throw err;
        });
      return gamer;
    } else {
      // not logged in, send back a 401
      throw new Error('Authorization failed!');
    }
  }

  /**
   * get all games this gamer has participated in
   *
   * @param {String} id gamer id
   * @returns a list of games this gamer has played in
   */
  async games(gamesService: GamesService, id: string) {
    console.log('getting games for gamer ' + id);

    const games = await gamesService.findAll().catch((err) => {
      throw err;
    });

    const gameHistory: GameHistory = {
      active: {
        // the currently active game (if any)
        inProgress: false,
        joined: false,
      },
      history: [], // list of games for this user
    };

    if (!games) throw new Error('Could not find Games');

    games.forEach(function (gamerecord) {
      const gameid = gamerecord.id;
      const game = gamerecord;

      const gameDetails = getGameDetails(game, gameid);
      addGracePeriod(gameDetails, 10);

      if (!tournamentComplete(gameDetails.start, gameDetails.end)) {
        // make this the active game
        gameHistory.active.event = gameDetails.event;
        gameHistory.active.eventid = gameDetails.eventid;

        if (tournamentInProgress(gameDetails.start, gameDetails.end)) {
          gameHistory.active.inProgress = true;
        }
      }

      // look through each game to see if current user is one of the players
      const gamerids = game.gamers ?? [];

      for (let j = 0; j < gamerids.length; j++) {
        if (id === gamerids?.[j].user) {
          // console.log(`user ${id} participated in game ${gameid}`);

          if (gameHistory.active.eventid == gameDetails.eventid) {
            gameHistory.active.joined = true;
          } else {
            // add it to our history
            gameHistory.history.push(gameDetails);
          }
        }
      }
    });

    // sort the gameHistory by date
    gameHistory.history.sort(function (a, b) {
      if (a.start === b.start) {
        return 0;
      } else {
        if (a.start === undefined) return 1;
        if (b.start === undefined) return -1;
        return a.start > b.start ? -1 : 1;
      }
    });

    return gameHistory;
  }
}
