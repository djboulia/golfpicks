import { Component, OnInit } from '@angular/core';

import { NgxSpinnerService } from "ngx-spinner";

import { GamerService } from 'src/app/shared/services/backend/gamer.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: any = null;

  baseUrl = '/component/user';

  errorMessage: any = null;
  isLoaded = false;

  constructor(
    private spinner: NgxSpinnerService,
    private gamerApi: GamerService
    ) { }

  ngOnInit(): void {
    const self = this;

    this.loading();

    this.gamerApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.users = data;
          self.loaded();
        },
        error(msg) {
          console.log('error getting users!! ', msg);
          self.error("Error loading users!");
        }
      });
  }

  private loading() {
    this.errorMessage = null;
    this.spinner.show();
    this.isLoaded = false;
  }

  private error(msg: string) {
    console.log(msg);

    this.errorMessage = msg;
    this.spinner.hide();
    this.isLoaded = false;
  }

  private loaded() {
    this.spinner.hide();
    this.isLoaded = true;
  }
}
