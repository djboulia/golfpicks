import { Component, OnInit } from '@angular/core';
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

  constructor(private gamerApi: GamerService) { }

  ngOnInit(): void {
    const self = this;

    this.errorMessage = null;

    this.gamerApi.getAll()
      .subscribe({
        next(data) {
          console.log('data ', data);

          self.users = data;
          self.isLoaded = true;
        },
        error(msg) {
          console.log('error getting users!! ', msg);
          self.errorMessage = "Error loading users!";
          self.isLoaded = false;
        }
      });
  }

}
