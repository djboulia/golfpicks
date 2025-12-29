import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LeaderboardGolfer } from '../../../services/golfpicks/game.model';

const getTotal = (holes: any[]) => {
  let total = 0;
  for (const hole of holes) {
    const score = parseInt(hole.score);
    if (!isNaN(score)) {
      total += score;
    }
  }
  return total === 0 ? '-' : total;
};

const getParTotal = (holes: number[]) => {
  let total = 0;
  for (const hole of holes) {
    total += hole;
  }
  return total;
};

const getParDifferential = (roundValue: string, roundPar: string) => {
  const roundValueInt = parseInt(roundValue);
  const roundParInt = parseInt(roundPar);
  if (isNaN(roundValueInt) || isNaN(roundParInt)) {
    return null;
  }
  return roundValueInt - roundParInt;
};

@Component({
  selector: 'app-tournament-leader-detail',
  templateUrl: './tournament-leader-detail.component.html',
  imports: [CommonModule],
})
export class TournamentLeaderDetailComponent implements OnInit {
  @Input() golfer: any;
  @Input() eventUrl: string = '';

  scores: any = null;
  roundNumber: number | null = null;

  constructor() {}

  ngOnInit(): void {
    // console.log('golfer: ', this.golfer);

    const roundDetails = { ...this.golfer?.round_details };
    if (!roundDetails) {
      return;
    }

    // sort round keys in descending order
    const rounds = Object.keys(roundDetails).sort((a: string, b: string) => {
      const aRound = parseInt(a, 10);
      const bRound = parseInt(b, 10);
      return bRound - aRound;
    });

    // first round in array is latest (current) round
    // console.log('rounds: ', rounds);
    this.roundNumber = parseInt(rounds[0], 10);
    const currentRound = roundDetails[rounds[0]];

    // console.log('currentRound: ', currentRound);
    if (currentRound) {
      const roundValues = currentRound.round_values;
      const roundParValues = currentRound.par_values;
      const front9 = [];
      for (let i = 0; i < 9; i++) {
        const roundValue = roundValues[i];
        const roundPar = roundParValues[i];
        front9.push({ score: roundValue, fromPar: getParDifferential(roundValue, roundPar) });
      }
      const back9 = [];
      for (let i = 9; i < 18; i++) {
        const roundValue = roundValues[i];
        const roundPar = roundParValues[i];
        back9.push({ score: roundValue, fromPar: getParDifferential(roundValue, roundPar) });
      }

      this.scores = {
        front9,
        front9Total: getTotal(front9),
        front9Par: getParTotal(roundParValues.slice(0, 9)),
        back9,
        back9Total: getTotal(back9),
        back9Par: getParTotal(roundParValues.slice(9, 18)),
      };

      // console.log('scores: ', this.scores);
    }
  }
}
