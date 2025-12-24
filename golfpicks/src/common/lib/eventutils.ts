import { GamersService } from 'src/gamers/gamers.service';
import { Course, TourEventRound, TourEventScore } from './pgascores/tourdata';
import { roundStatus } from './rounds';
import { parseNetScore } from './scores';
import { UpdateGamerDto } from 'src/gamers/dto/update-gamer.dto';
import { UpdateEventDto } from 'src/events/dto/update-event.dto';
import { EventDetailsDto } from 'src/events/dto/event-details.dto';

export type Golfer = {
  player_id: string;
  thru: string;
  name: string;
  rank: string;
  today?: string;
  total?: string;
  '1'?: string;
  '2'?: string;
  '3'?: string;
  '4'?: string;
};

//
// return an array of course information (course name, par, etc.) for
// each round in the tournament.
//
// courses :[ { "name": "Royal Aberdeen", "par": "70" }
//
export const getCourses = function (event: UpdateEventDto) {
  const list: Course[] = [];

  // console.log('event.rounds ', event.rounds);

  for (let i = 0; i < event.rounds.length; i++) {
    const round = { ...event.rounds[i] } as unknown as TourEventRound;

    round.course.date = round.date;

    // console.log(round);

    list.push(round.course);
  }

  // console.debug("eventUtils.courses:" + JSON.stringify(list));

  return list;
};

//
// find low net total score for the tournament
// uses golfer.total which should be in net score format (e.g. -1, E, +1)
//
// returns an integer value representing lowest score or NaN if there are no scores
//
export const lowNetTotal = function (golfers: Golfer[]) {
  let lowScore = NaN;

  // find lowest score
  for (let i = 0; i < golfers.length; i++) {
    const golfer = golfers[i];

    if (i == 0) {
      lowScore = parseNetScore(golfer.total);
    } else {
      if (parseNetScore(golfer.total) < lowScore) {
        lowScore = parseNetScore(golfer.total);
      }
    }
  }

  return lowScore;
};

//
// build a list of golfers leading the tournament
//
export const tournamentLeaders = function (golfers: Golfer[]) {
  const leaders: Golfer[] = [];
  const lowScore = lowNetTotal(golfers);

  // build a list of the leaders
  for (let i = 0; i < golfers.length; i++) {
    const golfer = golfers[i];

    if (golfer.total == lowScore.toString()) {
      leaders.push({ ...golfer });

      //    eventUtils.formatNetScore(netScore));
      console.debug('adding ' + golfer.name + ' score: ' + golfer.total);
    }
  }

  return leaders;
};

type NonPgaGolfer = {
  user: {
    _id: string;
    name: string;
  };
  handicap: string;
};
//
// This is only used in NON PGA events with net (handicapped) players
//
// we want to create a data structure which flattens the rounds to look like
// the following:
// players :[ { "player_id": "Tiger Woods", "1": 80, "2", 72, "3", 79 ... }
//
//
export const getGolfers = function (event: EventDetailsDto) {
  const players = event.players ? event.players : [];

  // put all of our players into a hash map
  const golfers: TourEventScore[] = [];

  for (let i = 0; i < players.length; i++) {
    const golfer = players[i] as unknown as NonPgaGolfer;
    const player_id = golfer.user._id;

    golfers.push({
      player_id: player_id,
      name: golfer.user.name,
      rank: golfer.handicap, // use handicap to rank players in non PGA events
      thru: '-',
    } as unknown as TourEventScore);
  }

  for (let i = 0; i < event.rounds.length; i++) {
    const round = event.rounds[i];
    const roundScores = round.scores ? round.scores : [];

    for (let j = 0; j < roundScores.length; j++) {
      const score = roundScores[j];

      // match up this score with the appropriate player
      for (let k = 0; k < golfers.length; k++) {
        if (golfers[k].player_id == score.player) {
          const roundNumber = i + 1;

          golfers[k][roundNumber.toString()] = score.score;
        }
      }
    }
  }

  // calculate current tournament totals for each player
  let currentRound = -1;
  const rndStatus = roundStatus(golfers, event.rounds.length);

  for (let i = rndStatus.length - 1; i >= 0; i--) {
    if (rndStatus[i]) {
      currentRound = i;
      break;
    }
  }

  if (currentRound >= 0) {
    for (let i = 0; i < golfers.length; i++) {
      const golfer = golfers[i];

      // sum up the scoring thus far
      golfer.total = '0';

      for (let j = 0; j <= currentRound; j++) {
        const roundNumber = (j + 1).toString();

        const roundScore = golfer[roundNumber] as unknown as string;
        golfer.total = (
          parseInt(golfer.total) + parseInt(roundScore)
        ).toString();
      }
    }
  }

  return golfers;
};

export const getPlayers = async function (
  gamersService: GamersService,
  event: EventDetailsDto,
) {
  // in a non-PGA round, the golfer ids and scores
  // will be contained directly in this object.  For PGA rounds
  // the scoring data is loaded separately from the official tour site
  console.log('Scoring format is : ' + event.scoreType);

  if (event.scoreType === 'pga-live-scoring') {
    console.log('PGA round, not loading golfer data');

    // return immediately since we aren't loading golfer data
    return event.players;
  } else {
    console.log('non PGA round, loading golfer data');

    const players = event.players ? [...event.players] : [];
    const ids: string[] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      ids.push(player.user);
    }

    const objs = await gamersService.findByIds(ids).catch(() => {
      const str = "Couldn't get player list " + JSON.stringify(ids);
      console.error(str);
      throw new Error(str);
    });

    // fluff up the players object with player data
    const playermap: Record<string, UpdateGamerDto> = {};

    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      playermap[obj.id] = obj;
    }

    const validplayers: { user: string }[] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const playerdetails = playermap[player.user];

      if (playerdetails) {
        player.user = playerdetails as unknown as string; // TODO: fix type mismatch
        validplayers.push(player);
      } else {
        console.log("couldn't find id " + player.user);
        console.log('roundmap: ' + JSON.stringify(playermap));
      }
    }

    // console.log("setting players " + JSON.stringify(validplayers));

    return validplayers;
  }
};

export const sortByRank = function (golfers: TourEventScore[]) {
  golfers.sort(function (a, b) {
    // djb [09/04/2022] handles ties in rankings
    const aRank = a.rank.startsWith('T') ? a.rank.substr(1) : a.rank;
    const bRank = b.rank.startsWith('T') ? b.rank.substr(1) : b.rank;

    // if unranked supply a sufficiently high numbrer
    const aRankNum = aRank == '-' ? 1000 : parseInt(aRank);
    const bRankNum = bRank == '-' ? 1000 : parseInt(bRank);

    return aRankNum - bRankNum;
  });

  return golfers;
};
