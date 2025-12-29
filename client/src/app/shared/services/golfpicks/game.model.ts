// interfaces for our backend

import { Gamer } from './gamer.model';

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

export interface GamerDetail {
  user: string;
  admin: boolean;
  username: string;
  password: string;
  name: string;
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
