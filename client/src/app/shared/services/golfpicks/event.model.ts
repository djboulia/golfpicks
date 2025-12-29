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

export interface EventWithDetails extends EventBase {
  rounds: RoundWithDetails[];
}
