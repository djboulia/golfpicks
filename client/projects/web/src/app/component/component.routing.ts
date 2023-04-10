import { Routes } from '@angular/router';
import { UsersComponent } from './user-components/users/users.component';
import { UserComponent } from './user-components/user/user.component';
import { CoursesComponent } from './course-components/courses/courses.component';
import { CourseinfoComponent } from './course-components/courseinfo/courseinfo.component';
import { CourseComponent } from './course-components/course/course.component';
import { EventsComponent } from './event-components/events/events.component';
import { EventComponent } from './event-components/event/event.component';
import { EventLeadersComponent } from './event-components/eventleaders/eventleaders.component';
import { GamesComponent } from './game-components/games/games.component';
import { GameComponent } from './game-components/game/game.component';
import { GameplayerComponent } from './game-components/gameplayer/gameplayer.component';
import { GameHistoryComponent } from './game-components/game-history/game-history.component';
import { LeaderboardComponent } from './leaderboard-components/leaderboard/leaderboard.component';
import { PicksComponent } from './picks/picks.component';

export const ComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'user',
        component: UserComponent,
      },
      {
        path: 'user/id/:id',
        component: UserComponent,
      },
      {
        path: 'courses',
        component: CoursesComponent,
      },
      {
        path: 'courseinfo/id/:id',
        component: CourseinfoComponent,
      },
      {
        path: 'course',
        component: CourseComponent,
      },
      {
        path: 'course/id/:id',
        component: CourseComponent,
      },
      {
        path: 'events',
        component: EventsComponent,
      },
      {
        path: 'event/id/:id',
        component: EventComponent,
      },
      {
        path: 'eventleaders/id/:id',
        component: EventLeadersComponent,
      },
      {
        path: 'games',
        component: GamesComponent,
      },
      {
        path: 'game',
        component: GameComponent,
      },
      {
        path: 'game/id/:id',
        component: GameComponent,
      },
      {
        path: 'gameplayer/id/:id',
        component: GameplayerComponent,
      },
      {
        path: 'gamehistory',
        component: GameHistoryComponent,
      },
      {
        path: 'leaderboard/id/:id',
        component: LeaderboardComponent,
      },
      {
        path: 'picks/id/:id',
        component: PicksComponent,
      },
    ],
  },
];
