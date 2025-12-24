import { IsOptional } from 'class-validator';

type Hole = {
  number: number;
  par: string;
  yardage: string;
  handicap: string;
};

export class CreateCourseDto {
  par: number;
  tee: string;
  name: string;
  yardage: number;
  location: {
    lng: string;
    lat: string;
  };
  slope: number;

  @IsOptional()
  holes?: Hole[];
}
