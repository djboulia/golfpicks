export type Hole = {
  score: string;
  fromPar: number | null;
};

export type Scores = {
  front9: Hole[];
  front9Total: string | number;
  front9Par: number;
  back9: Hole[];
  back9Total: string | number;
  back9Par: number;
};

export const getTotal = (holes: Hole[]): string | number => {
  let total = 0;
  for (const hole of holes) {
    const score = parseInt(hole.score);
    if (!isNaN(score)) {
      total += score;
    }
  }
  return total === 0 ? '-' : total;
};

export const getParTotal = (holes: number[]): number => {
  let total = 0;
  for (const hole of holes) {
    total += hole;
  }
  return total;
};

export const getParDifferential = (roundValue: string, roundPar: string): number | null => {
  const roundValueInt = parseInt(roundValue);
  const roundParInt = parseInt(roundPar);
  if (isNaN(roundValueInt) || isNaN(roundParInt)) {
    return null;
  }
  return roundValueInt - roundParInt;
};
