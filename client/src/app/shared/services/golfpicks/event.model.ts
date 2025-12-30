import { Course } from './course.model';

// interfaces for our backend
interface Round {
  date: string;
  course: string;
}

export interface EventBase {
  id: string;
  name: string;
  start: string;
  end: string;
  season: string;
  provider: string;
  scoreType: string;
  tournament_id: string;
}

export interface Event extends EventBase {
  rounds: Round[];
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

interface RoundWithDetails {
  date: string;
  course: Course;
}

interface RoundScores {
  round_values: string[];
  par_values: number[];
  net_values: string[];
}

export interface GolferDetails {
  player_id: string;
  rank: string;
  name: string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  strokes: number;
  pos: string;
  thru: number;
  today: string;
  total: string;
  round_details: {
    [key: string]: RoundScores;
  };
}

// TODO: should make this consistent with GolferDetails on backend
export interface GolferLeaderDetails {
  player_id: string;
  rank: string;
  name: string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  strokes: number;
  pos: string;
  thru: number;
  today: string;
  total: number;
  round_details: {
    [key: string]: RoundScores;
  };
}

export interface EventWithDetails extends EventBase {
  rounds: RoundWithDetails[];
  golfers: GolferDetails[];
}

export interface EventLeaders {
  name: string;
  courseInfo: Course[];
  golfers: GolferLeaderDetails[];
  roundNumbers: string[];
  lowRounds: (string | null)[];
}
