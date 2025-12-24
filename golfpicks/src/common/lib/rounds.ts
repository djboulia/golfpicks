import { CoursesService } from 'src/courses/courses.service';
import { Golfer } from './eventutils';
import { Course } from './pgascores/tourdata';
import {
  formatNetScore,
  isNumber,
  isValidScore,
  parseNetScore,
} from './scores';
import { UpdateCourseDto } from 'src/courses/dto/update-course.dto';
import { UpdateEventDto } from 'src/events/dto/update-event.dto';

type Leader = {
  name: string;
  score: string;
};

export const getCurrentRound = function (courseInfo: Course[]) {
  // courseInfo is an array of courses for each round of the
  // tournament.  each course has a date when that round will
  // be played.
  //
  // figure out the current round based on today's date
  // we do this to display the right course information.
  // each day's course could be different

  let currentCourse = courseInfo[0];
  let currentRound = 1;
  const now = Date.now();

  console.debug(
    'eventUtils.getCurrentRound: courseInfo ' + JSON.stringify(courseInfo),
  );

  for (let i = 1; i < courseInfo.length; i++) {
    const course = courseInfo[i];

    const delta1 = Date.parse(currentCourse.date) - now;
    const delta2 = Date.parse(course.date) - now;

    console.debug(
      'eventUtils.getCurrentRound: delta1 ' + delta1 + ', delta2 ' + delta2,
    );

    if (delta2 <= 0 && Math.abs(delta2) < Math.abs(delta1)) {
      currentCourse = course;
      currentRound = i + 1; // first round starts at 1
    }
  }

  return currentRound;
};

/**
 * [djb 04/10/2023] only return round numbers
 *
 * @param {*} courseinfo
 * @returns an array of titles for each round
 */
export const getRoundTitles = function (courseinfo: Course[]) {
  // build an array of titles for each round
  // the resulting array will consist of the supplied text plus
  // the round number (1, 2, 3, etc.)
  const roundTitles: string[] = [];

  for (let i = 0; i < courseinfo.length; i++) {
    const roundNumber = i + 1;

    roundTitles.push(roundNumber.toString());
  }

  return roundTitles;
};

export const lastRoundPlayed = function (roundStatus: number[]) {
  let roundPlayed = -1;

  for (let i = 0; i < roundStatus.length; i++) {
    if (roundStatus[i]) {
      roundPlayed = i;
    } else {
      break;
    }
  }

  return roundPlayed;
};

export const getRoundNetScore = function (
  golfer: Golfer,
  par: number,
  roundNumber: number,
  roundStatus: number[],
) {
  // find the net score for the given round. if the round we're looking for is the last played round,
  // we can use the "today" score since it represents the most recent score.  This will
  // allow us to display a meaningful "lowest" score relative to par when a round
  // is in progress
  //
  // if the round isn't the most recent, then just use the completed round net score to par
  //
  const lrPlayed = lastRoundPlayed(roundStatus);
  const useToday = lrPlayed == roundNumber ? true : false;

  // console.log(`useToday ${useToday}, par ${par}, roundNumber ${roundNumber}`);
  // console.log(`golfer.name ${golfer.name} golfer.today ${golfer.today}, golfer[roundNumber +1] - par ${golfer[roundNumber +1] - par}`);

  // console.log('getRoundNetScore: ', golfer, par, roundNumber, roundStatus);

  return useToday
    ? parseNetScore(golfer.today).toString()
    : formatNetScore(golfer[roundNumber + 1] - par);
};

/**
 *
 * find low net total score for the given round
 * uses golfer.total which should be in net score format (e.g. -1, E, +1)
 *
 * returns an integer value representing lowest score or NaN if there are no scores
 */
export const lowRoundNetTotal = function (
  golfers: Golfer[],
  par: number,
  roundNumber: number,
  roundStatus: number[],
) {
  let lowScore: string | undefined = undefined;

  for (let i = 0; i < golfers.length; i++) {
    const golfer = golfers[i];

    // djb [09/03/2022] instead of taking the first entry as the initial
    //                  low score, we instead keep going until we find a
    //                  valid initial score. this fixes a bug where the
    //                  first golfer's score isn't valid (e.g. he was cut
    //                  or didn't finish the round.)
    if (!isNumber(lowScore)) {
      lowScore = getRoundNetScore(golfer, par, roundNumber, roundStatus);
    } else {
      const netScore = getRoundNetScore(golfer, par, roundNumber, roundStatus);

      if (parseNetScore(netScore) < parseNetScore(lowScore)) {
        lowScore = netScore;
      }
    }
  }

  return lowScore;
};

//
// returns an array of leaders for a given round
//
export const singleRoundLeaders = function (
  golfers: Golfer[],
  courseInfo: Course[],
  roundNumber: number,
  roundStatus: number[],
) {
  const leaders: Leader[] = [];
  const par = courseInfo[roundNumber].par;
  const lowScore = lowRoundNetTotal(golfers, par, roundNumber, roundStatus);

  console.log('round ' + roundNumber + ' low score ' + lowScore);

  // build a list of the leaders
  for (let i = 0; i < golfers.length; i++) {
    const golfer = golfers[i];
    const netScore = getRoundNetScore(golfer, par, roundNumber, roundStatus);

    if (netScore == lowScore) {
      leaders.push({
        name: golfer.name,
        score: netScore,
      });

      console.debug(
        'adding ' +
          golfer.name +
          ' for round ' +
          roundNumber +
          ' with score: ' +
          netScore,
      );
    }
  }

  return leaders;
};

//
// returns an array of arrays of golfer records that represent each round
// index of the top level array indicates the leaders for each round
// the sub array is the list of leaders for that round
//
// returns an array or arrays with the leaders of each round
//
export const roundLeaders = function (golfers: Golfer[], courseInfo: Course[]) {
  // console.log('RoundLeaders golfers: ', golfers);
  // console.log('RoundLeaders courseInfo: ', courseInfo);

  const numberOfRounds = courseInfo.length;
  const rndStatus = roundStatus(golfers, numberOfRounds);
  const leaders: Leader[][] = [];

  console.log('Rounds started: ' + JSON.stringify(rndStatus));

  for (let i = 0; i < rndStatus.length; i++) {
    if (rndStatus[i]) {
      // for the rounds that have started, go get the leaders
      console.log('getting single round leaders for round ' + i);
      leaders.push(singleRoundLeaders(golfers, courseInfo, i, rndStatus));
    } else {
      // round not started, just put an empty array of leaders
      leaders.push([]);
    }
  }

  return leaders;
};

// [07/29/2016] had to change this based on the way the back end data for
//              live scoring is now reported. We use the "thru" key to
//              determine if anyone is mid way through a round
//
// identify rounds that have not yet started.  This will allow
// us to carry over prior day totals for players that haven't teed off yet
//
// as input, we expect an array of golfers (see golfers method below)
//
export const roundStatus = function (
  golfers: Golfer[],
  numberOfRounds: number,
) {
  const ROUND_STARTED = 1;
  const ROUND_NOT_STARTED = 0;

  const statusData: number[] = [];

  for (let i = 0; i < numberOfRounds; i++) {
    statusData.push(ROUND_NOT_STARTED);
  }

  for (const golfer of golfers) {
    for (let i = 0; i < numberOfRounds; i++) {
      let round = (i + 1).toString();

      round = round.toString();

      const score = golfer[round] as unknown as number;

      if (isValidScore(score)) {
        // console.debug("found valid score for round " + round + ", golfer " +
        //     JSON.stringify(golfer));
        statusData[i] = ROUND_STARTED;
      } else {
        // no valid score, but see if there is an in-progress round
        const thru = golfer['thru'];
        // console.debug("golfer " + golfer['name'] + " thru: " + thru);

        if (isNumber(thru) && Number(thru) < 18) {
          // console.debug("found in progress score for round " + round + ", golfer " +
          //     JSON.stringify(golfer) + " thru " + thru);
          statusData[i] = ROUND_STARTED;
        }

        // short circuit the loop here... last valid score
        break;
      }
    }
  }

  return statusData;
};

//
// returns the current round in progress
// returns 0 if no rounds have started
//
export const getCurrentRoundInProgress = function (
  golfers: Golfer[],
  numberOfRounds: number,
) {
  const rndStatus: number[] = roundStatus(golfers, numberOfRounds);

  console.debug('Rounds started: ' + JSON.stringify(rndStatus));

  // find most recently played round, walking backwards
  let currentRound = 0;

  for (let i = rndStatus.length - 1; i >= 0; i--) {
    if (rndStatus[i]) {
      currentRound = i + 1;
      break;
    }
  }

  return currentRound;
};

type Round = {
  course: string;
  date: string;
};

export const getRounds = async function (
  coursesService: CoursesService,
  event: UpdateEventDto,
) {
  const rounds = [...event.rounds];
  const ids: string[] = [];
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    ids.push(round.course);
  }

  const objs = await coursesService.findByIds(ids).catch(() => {
    const str = "Couldn't get course list " + JSON.stringify(ids);
    console.error(str);
    throw new Error(str);
  });

  // fluff up the rounds object with course data
  const roundmap: { [key: string]: UpdateCourseDto } = {};

  for (let i = 0; i < objs.length; i++) {
    const obj = objs[i];
    roundmap[obj.id] = obj;
  }

  const validrounds: Round[] = [];

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const coursedetails = roundmap[round.course];

    if (coursedetails) {
      round.course = coursedetails as unknown as string; // TODO: fix type mismatch
      validrounds.push(round);
    } else {
      console.log("couldn't find id " + round.course);
      console.log('roundmap: ' + JSON.stringify(roundmap));
    }
  }

  return validrounds;
};
