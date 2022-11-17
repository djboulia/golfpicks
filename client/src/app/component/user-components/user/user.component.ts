import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { TemplateRef } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Gamer, GamerAttributes } from 'src/app/shared/services/backend/gamer.interfaces';
import { GamerService } from 'src/app/shared/services/backend/gamer.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  id: any = null;
  user: any = null;

  errorMessage: any = null;
  parentUrl = '/component/users';
  baseUrl = '/component/user';

  title = 'New Player';
  confirmButton = 'Confirm';
  deleteButton = false;
  submitButton = 'Create';
  isLoaded = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private gamerApi: GamerService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    console.log(`id: ${this.id}`);

    if (this.id) {
      // edit an existing user
      const self = this;

      this.title = 'Update Player';
      this.deleteButton = true;
      this.submitButton = 'Save';

      // go get this user's record
      this.gamerApi.get(this.id)
        .subscribe({
          next(data) {
            console.log('data ', data);

            self.user = data;
            self.isLoaded = true;
          },
          error(msg) {
            console.log('error getting user!! ', msg);

            self.errorMessage = "Error loading user!";
            self.isLoaded = false;
          }
        });
    } else {
      // create a new user
      this.user = this.gamerApi.newModel();
      this.isLoaded = true;
    }

  }

  /**
   * confirm the delete with a modal before processing.
   * 
   * @param content TemplateRef for modal
   */
  onDelete(content: TemplateRef<any>) {
    console.log('delete clicked');

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      console.log('no action taken; closed with result ', result);
    }, (reason) => {
      if (this.deleteConfirmed(reason)) {
        this.deleteUser();
      }
    });
  }

  onAdmin() {
    this.user.attributes.admin = !this.user.attributes.admin;
  }

  onSubmit() {
    console.log('submit pressed!');

    if (this.id) {
      // existing gamer, update all fields
      this.updateGamer(this.user);
    } else {
      // new gamer, only send the attributes
      this.createGamer(this.user.attributes);
    }
  }

  private deleteUser() {
    const self = this;

    this.gamerApi.delete(this.id)
      .subscribe({
        next(data) {
          console.log('user deleted: ', data);

          self.router.navigate([self.parentUrl]);
        },
        error(msg) {
          console.log('error deleting user! ', msg);
          self.errorMessage = `Error deleting player ${self.user.attributes.name}!`;
        }
      });
  }

  private deleteConfirmed(reason: ModalDismissReasons): boolean {
    const text = `${reason}`;

    console.log('text: ', text);

    if (text === this.confirmButton) {
      console.log('delete confirmed');
      return true;
    }

    return false;
  }

  private updateGamer(gamer: Gamer) {
    const self = this;

    this.gamerApi.put(gamer)
      .subscribe({
        next(data) {
          console.log('user data saved: ', data);

          // update could have been to logged in user, so refresh the auth state
          self.auth.refresh()
            .subscribe(() => {
              console.log('refreshed user info');
              self.router.navigate([self.parentUrl]);
            })
        },
        error(msg) {
          console.log('error saving data! ', msg);
          self.errorMessage = "Error saving player data!";
        }
      });
  }

  private createGamer(attributes: GamerAttributes) {
    const self = this;

    console.log('creating player ', attributes);

    this.gamerApi.post(attributes)
      .subscribe({
        next(data) {
          console.log('user data created: ', data);

          self.router.navigate([self.parentUrl]);
        },
        error(msg) {
          console.log('error creating user! ', msg);
          self.errorMessage = "Error creating player!";
        }
      });
  }
}
