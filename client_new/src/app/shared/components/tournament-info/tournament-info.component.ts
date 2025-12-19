import { Component, Input } from '@angular/core';
import { GAMEURLS } from '../../../app.routes';

@Component({
  selector: 'app-tournament-info',
  templateUrl: './tournament-info.component.html',
})
export class TournamentInfoComponent {
  @Input() id = '';

  eventOverviewUrl = GAMEURLS.eventOverview;
  eventLeaderUrl = GAMEURLS.eventLeader;

  constructor() {}
}
