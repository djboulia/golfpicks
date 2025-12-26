import {
  formatNetScore,
  isNumber,
  isValidNetScore,
  isValidScore,
  parseNetScore,
} from './scores';
import { isValidTeeTime } from './gameutils';
import { PickDto } from 'src/games/dto/pick.dto';
import { GamePlayerDetailsDto } from 'src/games/dto/game-player-details.dto';

type Score = {
  player_id: string;
  name: string;
};

// [djb 7/29/2016] changes in the way the back end provider handles
//                 scoring made me change the method for finding the
//                 score for rounds in progress.  We now look at
//                 the "thru" key to see if the round is in progress
// look at today's score and figure out if round is in progress
const findTodayScoreIndex = function (pick: PickDto, rounds: string[]) {
  const todayScore = pick['today'];
  const thru = pick['thru'];
  let today = -1;
  let rnd: number;

  const inProgress = isNumber(thru) && Number(thru) < 18 ? true : false;

  if (inProgress && todayScore != '-') {
    // round is in progress, find first round without a valid score
    for (rnd = 0; rnd < rounds.length; rnd++) {
      if (!isValidScore(rounds[rnd])) {
        today = rnd;
        break;
      }
    }

    console.debug(
      'round is in progress, using today index of ' +
        rnd +
        ' rounds of ' +
        JSON.stringify(rounds),
    );
  }

  return today;
};

const getCurrentScores = function (
  rounds: number,
  top5: number[][],
  enforceCutLine: boolean,
) {
  const currentscores: string[] = [];
  let j: number, k: number;

  for (j = 0; j < rounds; j++) {
    let net = 0;
    for (k = 0; k < Math.min(5, top5[j].length); k++) {
      net += top5[j][k];
    }

    let val = top5[j].length == 0 ? '-' : formatNetScore(net);

    if (enforceCutLine) {
      // djb [08/09/2014] if there are less than 5 valid scores,
      // then this gamer has "missed the cut" and therefore the
      // scores don't count
      //
      // djb [04/09/2015] don't look at first two rounds since
      // there is no cut yet
      if (j > 1 && top5[j].length > 0 && top5[j].length < 5) {
        console.log(
          'Round ' +
            (j + 1) +
            ' top 5 has only ' +
            top5[j].length +
            ' valid scores.',
        );
        val = 'MC';
      }
    }
    currentscores.push(val);
  }

  return currentscores;
};

type Course = {
  par: number;
};
//
// convert the raw round data into a round total in net format
// e.g. 72 on a par 72 is a net of 0, 71 net of -1, 73 net of +1, etc.
// special case is a round in progress - see findTodayScoreIndex
//
// isLiveScoring - indicates the data has hole-by-hole live scoring information
//                 vs. net totals for complete rounds
//
const getRoundNetTotals = function (
  courseInfo: Course[],
  roundStartedData: number[],
  pick: PickDto,
  isLiveScoring: boolean,
) {
  // console.debug("getRoundTotals: isLiveScoring=" + isLiveScoring);

  const rounds: string[] = [];
  const par: number[] = [];
  const roundtotals: string[] = [];

  for (let i = 0; i < courseInfo.length; i++) {
    let roundNumber = (i + 1).toString();
    roundNumber = roundNumber.toString();

    let score = pick[roundNumber] as string;

    // djb [04-07-2017] more changes due to back end pga site differences
    if (!score) {
      score = '-';
    }
    rounds.push(score);

    par.push(courseInfo[i].par);
    roundtotals.push('-');
  }

  const todayScore = isLiveScoring ? pick['today'] : '';
  const todayIndex = isLiveScoring ? findTodayScoreIndex(pick, rounds) : -1;
  let roundtotal = 0;

  // console.debug("getRoundTotals: todayIndex=" + todayIndex);

  for (let j = 0; j < rounds.length; j++) {
    // scores can include non numeric values, like "MC" for missed cut
    // so check the validity of the score before trying to use it
    if (todayIndex == j) {
      const net = parseNetScore(todayScore);

      roundtotal += net;

      roundtotals[j] = roundtotal.toString();
    } else if (isValidScore(rounds[j])) {
      const net = parseInt(rounds[j]) - par[j];

      roundtotal += net;

      roundtotals[j] = roundtotal.toString();
    } else {
      // djb [08/08/2014]
      // look for case where the 2nd/3rd/4th round is in progress, but player hasn't started yet
      // only take rounds where the score is a tee time to avoid WDs, MCs, etc.

      if (
        j > 0 &&
        (isValidTeeTime(rounds[j]) || rounds[j] == '-') &&
        roundStartedData[j]
      ) {
        // take yesterday's total
        roundtotals[j] = roundtotals[j - 1];

        console.log(
          'In progress round, player ' +
            pick.name +
            " hasn't started (" +
            rounds[j] +
            ').  Putting in ' +
            roundtotals[j] +
            ' score.',
        );
      } else {
        if (isValidTeeTime(rounds[j])) {
          roundtotals[j] = '-'; // round hasn't started yet, just display a -
        } else {
          // no valid score, might be MC, WD, etc. - make that the total here
          roundtotals[j] = rounds[j];
        }
      }
    }
  }

  // console.debug("getRoundNetTotals: pick " + JSON.stringify(pick) +
  //     " roundtotals = " + JSON.stringify(roundtotals));

  return roundtotals;
};

const updateTop5 = function (roundTotalString: string, top5: number[]) {
  let splicePos = top5.length;
  const roundtotal = parseInt(roundTotalString);

  if (!isNaN(roundtotal)) {
    for (let k = 0; k < top5.length; k++) {
      if (roundtotal < Number(top5[k])) {
        splicePos = k;
        break;
      }
    }
    top5.splice(splicePos, 0, roundtotal);
  }

  return top5;
};

// pretty print totals into display form
const formatTotals = function (totals: string[]) {
  const fmt: string[] = [];

  for (let j = 0; j < totals.length; j++) {
    const net = totals[j];
    const val = isNaN(Number(net)) ? '-' : formatNetScore(Number(net));
    fmt.push(val);
  }
  return fmt;
};

const roundMax = function (gamers: GamePlayerDetailsDto[]) {
  // calculate the round leaders for each round
  //
  // [06/10/2014] fixed a bug where roundmax was initially loaded with zero
  // find the max score in each round, start with first player
  const roundmax: string[] = [];

  for (let j = 0; j < gamers[0].scores.length; j++) {
    const score = parseNetScore(gamers[0].scores[j]);
    roundmax[j] = isNaN(score)
      ? ''
      : parseNetScore(gamers[0].scores[j]).toString();
  }

  gamers.forEach(function (gamer) {
    for (let j = 0; j < gamer.scores.length; j++) {
      const score = parseNetScore(gamer.scores[j]);
      if (!isNaN(score) && Number(roundmax[j]) > score) {
        // lower is better, this is golf
        roundmax[j] = score.toString();
      }
    }
  });

  return roundmax;
};

//
// build a data structure like the following:
// an array of gamers, with their picks, totals, and scores
// each pick is an array of golfers with their round scores
// all scores are stored and formatted as net to par,
// e.g. E for even, -1 for 1 under, +2 for 2 over, a dash ("-")
// when there is no score (either due to missed cut or round not
// yet completed
//
//  [ { "name" : "Don Boulia", "objectId" : "c0323-234234-234234-2343"
//	  "picks"  : [ { "name" : "Tiger Woods", "rounds" : [ "+1", "E", "-3", "-5"]}...],
//	  "totals" : [ "+1", "+5", "E", "-1"],
//	  "scores" : [ "+1", "E", "-3 ... ] }, ... ]

export const getScores = function (
  courseInfo: Course[],
  roundStartedData: number[],
  players: GamePlayerDetailsDto[],
  scoreType,
) {
  const details: GamePlayerDetailsDto[] = [];
  let enforceCutLine = false;
  let isLiveScoring = false;

  if (scoreType == 'pga-live-scoring') {
    console.log('Scoring format is: live scoring with cut line');

    enforceCutLine = true;
    isLiveScoring = true;
  } else {
    console.log('Scoring format is: round net total with no cut line');
  }

  for (let pndx = 0; pndx < players.length; pndx++) {
    const playerDetails: GamePlayerDetailsDto = {
      name: players[pndx].user.name,
      objectId: players[pndx].user.id,
      user: players[pndx].user,
      picks: [],
      totals: [],
      scores: [],
      rounds: [],
    };

    const totals: string[] = [];
    const top5: number[][] = [];

    for (let i = 0; i < roundStartedData.length; i++) {
      totals.push('-');
      top5.push([]);
    }

    const picks = players[pndx].picks;

    for (let i = 0; i < picks.length; i++) {
      const pickDetail: PickDto = {
        id: picks[i].id,
        player_id: picks[i].player_id,
        name: picks[i].name,
        rounds: [],
        today: picks[i].today,
        thru: picks[i].thru,
      };

      const roundtotals = getRoundNetTotals(
        courseInfo,
        roundStartedData,
        picks[i],
        isLiveScoring,
      );

      for (let j = 0; j < roundtotals.length; j++) {
        let displayVal = roundtotals[j];

        if (isValidNetScore(roundtotals[j])) {
          displayVal = formatNetScore(Number(roundtotals[j]));

          // if this is the first valid score, then initialize
          // the totals for this round
          if (totals[j] == '-') totals[j] = '0';

          // update our running totals and top5 list
          totals[j] = (Number(totals[j]) + Number(roundtotals[j])).toString();
          top5[j] = updateTop5(roundtotals[j], top5[j]);
        } else {
          console.debug(
            'returning non score value ' +
              displayVal +
              '(round ' +
              (j + 1) +
              ') for player ' +
              picks[i].name,
          );
        }

        // debug
        //				displayVal += " (" + roundtotals[j] + ")";

        pickDetail['rounds'].push(displayVal);
      }

      playerDetails['picks'].push(pickDetail);
    }

    console.log(
      'Top5 scores for ' + playerDetails['name'] + ' : ' + JSON.stringify(top5),
    );

    const currentscores = getCurrentScores(totals.length, top5, enforceCutLine);

    playerDetails['totals'] = formatTotals(totals);
    playerDetails['scores'] = currentscores;
    details.push(playerDetails);
  }

  return details;
};

// fill in each player's picks with the scores
// from this event
export const expandPicks = function (picks: PickDto[], scores: Score[]) {
  const pickscores: Score[] = [];

  for (let j = 0; j < picks.length; j++) {
    for (let i = 0; i < scores.length; i++) {
      if (scores[i].player_id == picks[j].id) {
        pickscores.push(scores[i]);
        break;
      }
    }
  }

  console.debug('expandPicks: ' + JSON.stringify(pickscores));

  return pickscores;
};

//
// adds an array called "rounds" to each gamer. each array element
// contains two fields - their score, and a boolean indicating if they are
// the round leader
//
export const addRoundLeaders = function (gamers: GamePlayerDetailsDto[]) {
  if (gamers.length === 0) {
    return gamers;
  }

  const roundmax = roundMax(gamers);
  console.debug('Max for rounds: ' + JSON.stringify(roundmax));

  // now do the leaderboard
  gamers.forEach(function (gamer) {
    gamer.rounds = [];

    for (let j = 0; j < gamer.scores.length; j++) {
      const score = gamer.scores[j];

      // [06/21/2015] roundmax is a net score, so compare to that when
      // determining round leader
      const netScore = parseNetScore(score);

      if (!isNaN(netScore) && netScore === Number(roundmax[j])) {
        gamer.rounds[j] = {
          score: score,
          leader: true,
        };
      } else {
        gamer.rounds[j] = {
          score: score,
          leader: false,
        };
      }
    }
  });

  return gamers;
};
