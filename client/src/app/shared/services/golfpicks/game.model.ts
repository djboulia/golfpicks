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

export interface GameDay {
  id: string;
  name: string;
  start: string;
  end: string;
  event: string;
  gamers: Gamer[];
  gameDay: {
    inProgress: boolean;
    complete: boolean;
  };
}
