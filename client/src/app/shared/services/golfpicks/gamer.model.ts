// interfaces for our backend

export interface Pick {
  id: string;
}

export interface GamerBase {
  admin?: boolean;
  username: string;
  password: string;
  name: string;
}

export interface Gamer extends GamerBase {
  id: string;
}

export interface GamerHistoryGame {
  event: string;
  eventid: string;
  start: number;
  end: number;
}

export interface GamerHistory {
  active: {
    inProgress: boolean;
    joined: boolean;
    event: string;
    eventid: string;
  };
  history: GamerHistoryGame[];
}
