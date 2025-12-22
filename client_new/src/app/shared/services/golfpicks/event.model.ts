// interfaces for our backend

export interface Event {
  id: string;
  name: string;
  start: string;
  end: string;
  season: string;
  provider: string;
  scoreType: string;
  tournament_id: string;
  rounds: [];
}

export interface Schedule {
  name: string;
  start: string;
  end: string;
  courses: [];
  provider: string;
  year: string;
  tournament_id: string;
}
