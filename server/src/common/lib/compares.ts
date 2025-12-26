import { isValidScore } from './scores';

const formatScore = (score: string) => {
  if (!score) return NaN;

  if (score === 'E') return 0;

  if (score.startsWith('+')) {
    return Number.parseInt(score.substring(1));
  }

  return Number.parseInt(score);
};

export const compareScores = (scoreA: string, scoreB: string) => {
  const roundA = formatScore(scoreA);
  const roundB = formatScore(scoreB);

  //   console.log('roundA: ', roundA, ' roundB: ', roundB);

  // all non scores (WD, CUT, '-', etc.) will sort to the bottom
  // we further sort WDs to the very bottom
  if (Number.isNaN(roundA) && Number.isNaN(roundB)) {
    if (scoreA === scoreB) return 0;
    if (scoreA === 'WD') return 1;
    if (scoreB === 'WD') return -1;
    return 0;
  }
  if (Number.isNaN(roundA)) return 1;
  if (Number.isNaN(roundB)) return -1;

  return roundA - roundB;
};

//
// pos is a string either with the golfer's place in the tournament (1,2,3) or their
// status if they are no longer in the tournament: CUT, WD, DNS
//
export const comparePosition = function (a: string, b: string) {
  if (a == b) {
    return 0;
  }

  // position will start with a T for any ties - remove that
  if (a.slice(0, 1) == 'T') {
    a = a.slice(1);
  }

  if (b.slice(0, 1) == 'T') {
    b = b.slice(1);
  }

  if (isValidScore(a) && isValidScore(b)) {
    return parseInt(a) - parseInt(b);
  } else if (isValidScore(a)) {
    return -1;
  } else if (isValidScore(b)) {
    return 1;
  } else {
    // neither are numbers, so compare strings

    // DNS = Did Not Start... always sort these to the bottom
    if (a == 'DNS') {
      return 1;
    } else if (b == 'DNS') {
      return -1;
    }

    // last resort, just compare strings
    return a.localeCompare(b);
  }
};
