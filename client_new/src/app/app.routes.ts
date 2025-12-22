import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { LoginComponent } from './pages/auth-pages/login/login.component';
import { AuthGuard } from './app.guard';
import { MainComponent } from './pages/main/main.component';
import { AboutComponent } from './pages/about/about.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';
import { CourseInfoComponent } from './shared/components/course/course-info/course-info.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CourseComponent } from './pages/course/course.component';
import { TournamentComponent } from './pages/tournament/tournament.component';
import { TournamentLeadersComponent } from './pages/tournament-leaders/tournament-leaders.component';
import { GamesComponent } from './pages/games/games.component';
import { GameComponent } from './pages/game/game.component';
import { GamersComponent } from './pages/gamers/gamers.component';
import { TournamentsComponent } from './pages/tournaments/tournaments.component';
import { PlayersComponent } from './pages/players/players.component';
import { PlayerComponent } from './pages/player/player.component';
import { PicksComponent } from './pages/picks/picks.component';
import { ProfileComponent } from './pages/auth-pages/profile/profile.component';

export const GAMEURLS = {
  main: '/',
  history: '/',
  about: '/about',
  leaderboard: '/leaderboard',
  picks: '/picks',
  tournaments: '/tournaments',
  tournamentOverview: '/tournament',
  tournamentLeaders: '/tournamentleaders',
  courses: '/courses',
  course: '/course',
  courseInfo: '/courseinfo',
  games: '/games',
  game: '/game',
  gamers: '/gamers',
  players: '/players',
  player: '/player',
};

const makeRelativeUrl = (path: string) => {
  return path.startsWith('/') ? path.substring(1) : path;
};

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: makeRelativeUrl(GAMEURLS.main),
        component: MainComponent,
        pathMatch: 'full',
        title: 'GolfPicks - Pick the Major Winners!',
      },
      {
        path: makeRelativeUrl(GAMEURLS.about),
        component: AboutComponent,
        title: 'About this Application',
      },
      {
        path: makeRelativeUrl(GAMEURLS.leaderboard) + '/id/:id',
        component: LeaderboardComponent,
        title: 'Leaderboard - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.courses),
        component: CoursesComponent,
        title: 'Course Info - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.course),
        component: CourseComponent,
        title: 'Course Add - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.course) + '/id/:id',
        component: CourseComponent,
        title: 'Course Edit - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.courseInfo) + '/id/:id',
        component: CourseInfoComponent,
        title: 'Course Info - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.tournaments),
        component: TournamentsComponent,
        title: 'Tournaments - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.tournamentOverview) + '/id/:id',
        component: TournamentComponent,
        title: 'Tournament Overview - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.tournamentLeaders) + '/id/:id',
        component: TournamentLeadersComponent,
        title: 'Tournament Leaders - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.games),
        component: GamesComponent,
        title: 'Games - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.game),
        component: GameComponent,
        title: 'Game Add - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.game + '/id/:id'),
        component: GameComponent,
        title: 'Game Edit - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.gamers + '/id/:id'),
        component: GamersComponent,
        title: 'Gamers - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.players),
        component: PlayersComponent,
        title: 'Players - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.player),
        component: PlayerComponent,
        title: 'Player - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.player + '/id/:id'),
        component: PlayerComponent,
        title: 'Player - GolfPicks',
      },
      {
        path: makeRelativeUrl(GAMEURLS.picks + '/id/:id'),
        component: PicksComponent,
        title: 'Picks - GolfPicks',
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
    ],
  },
  // auth pages
  {
    path: 'login',
    component: LoginComponent,
    title: 'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template',
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template',
  },
];
