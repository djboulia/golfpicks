import { Component, OnInit } from '@angular/core';
import { BaseLoadingComponent } from '../../base.loading.component';

import { NgxSpinnerService } from 'ngx-spinner';

import { GamerService } from '../../../shared/services/backend/gamer.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent extends BaseLoadingComponent implements OnInit {
  users: any = null;

  baseUrl = '/component/user';

  constructor(
    public spinner: NgxSpinnerService,
    private gamerApi: GamerService,
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    this.gamerApi.getAll().subscribe({
      next(data) {
        console.log('data ', data);

        self.users = data;
        self.loaded();
      },
      error(msg) {
        console.log('error getting users!! ', msg);
        self.error('Error loading users!');
      },
    });
  }
}
