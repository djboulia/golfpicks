// interfaces for our backend

import { Hole } from './course.model';
import { Gamer, GamerBase } from './gamer.model';

export interface Game {
  id: string;
  name: string;
  start: string;
  end: string;
  event: string;
  gamers: Gamer[];
}

export interface GameDayGamer {
  user: string;
  picks?: { id: string }[];
}

export interface GameDay {
  id: string;
  name: string;
  start: string;
  end: string;
  event: string;
  gamers: GameDayGamer[];
  gameDay: {
    inProgress: boolean;
    complete: boolean;
  };
}

// TODO: should change the backend to make this consistent with Gamer interface
export interface GamerDetail extends GamerBase {
  user: string;
}

export interface GamerDetailPicks extends GamerDetail {
  picks?: { id: string }[];
}

export interface GamerDetails {
  id: string;
  name: string;
  start: string;
  end: string;
  event: string;
  gamers: GamerDetailPicks[];
  notplaying: GamerDetail[];
}

export interface CourseInfo {
  par: number;
  yardage: number;
  tee: string;
  name: string;
  rating: number;
  location: {
    lat: string;
    lng: string;
  };
  slope: number;
  holes: Hole[];
  id: string;
  date: string;
}

export interface LeaderboardGolfer {
  player_id: string;
  name: string;
  rounds: string[];
  today: string;
  thru: number;
}

export interface LeaderboardRound {
  score: string;
  leader: boolean;
}

export interface LeaderboardGamer {
  name: string;
  objectId: string;
  user: Gamer;
  picks: LeaderboardGolfer[];
  totals: string[];
  scores: string[];
  rounds: LeaderboardRound[];
}

export interface RoundInfo {
  currentRound: number;
  roundTitles: string[];
}

export interface Leaderboard {
  name: string;
  courseInfo: CourseInfo[];
  roundInfo: RoundInfo;
  gamers: LeaderboardGamer[];
}
