import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ComponentsRoutes } from './component.routing';
import { UsersComponent } from './user-components/users/users.component';
import { UserComponent } from './user-components/user/user.component';
import { CoursesComponent } from './course-components/courses/courses.component';
import { CourseinfoComponent } from './course-components/courseinfo/courseinfo.component';
import { CourseComponent } from './course-components/course/course.component';
import { EventsComponent } from './event-components/events/events.component';
import { EventComponent } from './event-components/event/event.component';
import { EventLeadersComponent } from './event-components/eventleaders/eventleaders.component';
import { GameComponent } from './game-components/game/game.component';
import { GamesComponent } from './game-components/games/games.component';
import { GameplayerComponent } from './game-components/gameplayer/gameplayer.component';
import { GameHistoryComponent } from './game-components/game-history/game-history.component';
import { LeaderboardComponent } from './leaderboard-components/leaderboard/leaderboard.component';
import { PicksComponent } from './picks/picks.component';
import { ScoreBoardComponent } from './leaderboard-components/score-board/score-board.component';
import { UserScoreBoardComponent } from './leaderboard-components/user-score-board/user-score-board.component';
import { WeatherComponent } from './leaderboard-components/weather/weather.component';
import { CourseOverviewComponent } from './leaderboard-components/course-overview/course-overview.component';

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    RouterModule.forChild(ComponentsRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    GoogleMapsModule,
  ],
  declarations: [
    UsersComponent,
    UserComponent,
    CoursesComponent,
    CourseinfoComponent,
    CourseComponent,
    EventsComponent,
    EventComponent,
    EventLeadersComponent,
    GameComponent,
    GamesComponent,
    GameplayerComponent,
    GameHistoryComponent,
    LeaderboardComponent,
    PicksComponent,
    ScoreBoardComponent,
    UserScoreBoardComponent,
    WeatherComponent,
    CourseOverviewComponent,
  ],
})
export class ComponentsModule {}
