import { Course, TourEventScore } from 'src/common/lib/pgascores/tourdata';
import { UpdateEventDto } from './update-event.dto';

export class EventDetailsDto extends UpdateEventDto {
  players?: { user: string }[];
  golfers?: (TourEventScore & { index?: number })[];
  roundInfo?: { currentRound: number; roundTitles: string[] };
  courseInfo?: Course[];
}
