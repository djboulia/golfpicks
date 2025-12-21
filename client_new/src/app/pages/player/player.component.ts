import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../../shared/services/auth/auth.service';
import { Gamer } from '../../shared/services/golfpicks/gamer.model';
import { GamerService } from '../../shared/services/golfpicks/gamer.service';
import { ModalService } from '../../shared/services/modal.service';
import { LoaderService } from '../../shared/services/loader.service';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { ModalConfirmComponent } from '../../shared/components/common/modal-confirm/modal-confirm.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SwitchComponent } from '../../shared/components/form/input/switch.component';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  imports: [
    PageLoadComponent,
    ModalConfirmComponent,
    ButtonComponent,
    InputFieldComponent,
    SwitchComponent,
  ],
})
export class PlayerComponent implements OnInit {
  id: any = null;
  user: Gamer | undefined;

  parentUrl = '/component/users';
  baseUrl = '/component/user';

  title = 'New Player';
  confirmButton = 'Confirm';
  deleteButton = false;
  submitButton = 'Create';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private gamerApi: GamerService,
    protected deleteModal: ModalService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loader.setLoading(true);

    if (this.id) {
      // edit an existing user
      this.title = 'Update Player';
      this.deleteButton = true;
      this.submitButton = 'Save';

      // go get this user's record
      this.gamerApi.get(this.id).subscribe({
        next: (gamer) => {
          console.log('data ', gamer);

          this.user = gamer;
          this.loader.setLoading(false);
        },
        error: (msg) => {
          console.log('error getting user!! ', msg);

          this.loader.setErrorMessage('Error loading user!');
        },
      });
    } else {
      // create a new user
      this.user = this.gamerApi.newModel();
      this.loader.setLoading(false);
    }
  }

  /**
   * confirm the delete with a modal before processing.
   */
  onDelete() {
    console.log('delete clicked');
    this.deleteModal.openModal();
  }

  onCancel() {
    console.log('cancel pressed!');
    this.deleteModal.closeModal();
  }

  onConfirm() {
    console.log('confirm pressed!');
    this.deleteUser();
    this.deleteModal.closeModal();
  }

  onAdmin() {
    if (!this.user) {
      return;
    }
    this.user.admin = !this.user.admin;
  }

  onSubmit() {
    console.log('submit pressed!');
    if (!this.user) {
      return;
    }

    if (this.id) {
      // existing gamer, update all fields
      this.updateGamer(this.user);
    } else {
      // new gamer, only send the attributes
      this.createGamer(this.user);
    }
  }

  private deleteUser() {
    this.loader.setLoading(true);

    this.gamerApi.delete(this.id).subscribe({
      next: (data) => {
        console.log('user deleted: ', data);

        this.loader.setLoading(false);
        this.router.navigate([this.parentUrl]);
      },
      error: (msg) => {
        console.log('error deleting user! ', msg);
        this.loader.setErrorMessage(`Error deleting player ${this.user?.name}!`);
      },
    });
  }

  // private deleteConfirmed(reason: ModalDismissReasons): boolean {
  //   const text = `${reason}`;

  //   console.log('text: ', text);

  //   if (text === this.confirmButton) {
  //     console.log('delete confirmed');
  //     return true;
  //   }

  //   return false;
  // }

  private updateGamer(gamer: Gamer) {
    this.loader.setLoading(true);

    this.gamerApi.put(gamer).subscribe({
      next: (data) => {
        console.log('user data saved: ', data);

        // update could have been to logged in user, so refresh the auth state
        this.auth.refresh().subscribe(() => {
          console.log('refreshed user info');

          this.loader.setLoading(false);
          this.router.navigate([this.parentUrl]);
        });
      },
      error: (msg) => {
        console.log('error saving data! ', msg);
        this.loader.setErrorMessage('Error saving player data!');
      },
    });
  }

  private createGamer(gamer: Gamer) {
    this.loader.setLoading(true);

    console.log('creating player ', gamer);

    this.gamerApi.post(gamer).subscribe({
      next: (data) => {
        console.log('user data created: ', data);

        this.loader.setLoading(false);
        this.router.navigate([this.parentUrl]);
      },
      error: (msg) => {
        console.log('error creating user! ', msg);
        this.loader.setErrorMessage('Error creating player!');
      },
    });
  }
}
