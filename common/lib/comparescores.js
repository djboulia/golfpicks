const formatScore = (score) => {
  if (!score) return NaN;

  if (score === 'E') return 0;

  if (score.startsWith('+')) {
    return Number.parseInt(score.substring(1));
  }

  return Number.parseInt(score);
};

compareScores = (scoreA, scoreB) => {
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

module.exports = compareScores;
