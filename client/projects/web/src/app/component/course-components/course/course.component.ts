import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { TemplateRef } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

import { NgxSpinnerService } from 'ngx-spinner';
import { BaseLoadingComponent } from '../../base.loading.component';

import { AuthService } from '../../../shared/services/auth/auth.service';
import { CourseService } from '../../../shared/services/backend/course.service';
import { Course } from '../../../shared/services/backend/course.interface';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
})
export class CourseComponent extends BaseLoadingComponent implements OnInit {
  id: string | null = null;
  course: Course;

  parentUrl = '/component/courses';
  baseUrl = '/component/course';

  title = 'New Course';
  confirmButton = 'Confirm';
  deleteButton = false;
  submitButton = 'Create';

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private courseApi: CourseService,
  ) {
    super(spinner);

    this.course = courseApi.newModel();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loading();

    if (this.id) {
      // edit an existing user
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      this.title = 'Update Course';
      this.deleteButton = true;
      this.submitButton = 'Save';

      // go get this user's record
      this.courseApi.get(this.id).subscribe({
        next(data) {
          console.log('data ', data);

          if (!data) {
            self.error('Error loading course!');
          } else {
            self.course = data;
            self.loaded();
          }
        },
        error(msg) {
          console.log('error getting course!! ', msg);

          self.error('Error loading course!');
        },
      });
    } else {
      // create a new user
      this.course = this.courseApi.newModel();
      this.loaded();
    }
  }

  /**
   * confirm the delete with a modal before processing.
   *
   * @param content TemplateRef for modal
   */
  onDelete(content: TemplateRef<any>) {
    console.log('delete clicked');

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        console.log('no action taken; closed with result ', result);
      },
      (reason) => {
        if (this.deleteConfirmed(reason)) {
          this.deleteUser();
        }
      },
    );
  }

  onSubmit() {
    console.log('submit pressed!');

    this.updatePar(this.course);
    this.updateYardage(this.course);

    if (this.id) {
      // existing gamer, update all fields
      this.updateCourse(this.course);
    } else {
      // new gamer, only send the attributes
      this.createCourse(this.course);
    }
  }

  private deleteUser() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    if (!this.id) {
      this.error('Invalid id!');
      return;
    }

    this.courseApi.delete(this.id).subscribe({
      next(data) {
        console.log('course deleted: ', data);

        self.loaded();
        self.router.navigate([self.parentUrl]);
      },
      error(msg) {
        console.log('error deleting course! ', msg);
        self.error(`Error deleting course ${self.course.name}!`);
      },
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

  private updateCourse(course: Course) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    this.courseApi.put(course).subscribe({
      next(data) {
        console.log('Course data saved: ', data);

        course.location.lat = Number.parseFloat(course.location.lat.toString());
        course.location.lng = Number.parseFloat(course.location.lng.toString());

        // update could have been to logged in user, so refresh the auth state
        self.auth.refresh().subscribe(() => {
          console.log('refreshed course info');

          self.loaded();
          self.router.navigate([self.parentUrl]);
        });
      },
      error(msg) {
        console.log('error saving data! ', msg);
        self.error('Error saving course data!');
      },
    });
  }

  private createCourse(course: Course) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.loading();

    console.log('creating course ', course);
    course.location.lat = Number.parseFloat(course.location.lat.toString());
    course.location.lng = Number.parseFloat(course.location.lng.toString());

    this.courseApi.post(course).subscribe({
      next(data) {
        console.log('course data created: ', data);

        self.loaded();
        self.router.navigate([self.parentUrl]);
      },
      error(msg) {
        console.log('error creating course! ', msg);
        self.error('Error creating course!');
      },
    });
  }

  private updatePar(course: Course) {
    if (course.holes.length >= 0) {
      course.par = 0;

      for (let i = 0; i < course.holes.length; i++) {
        console.log(`course hole: ${i} par: ${course.holes[i].par}`);
        course.par += +course.holes[i].par;
        console.log(`course par: ${course.par}`);
      }
    }
  }

  private updateYardage(course: Course) {
    if (course.holes.length >= 0) {
      course.yardage = 0;

      for (let i = 0; i < course.holes.length; i++) {
        course.yardage += +course.holes[i].yardage;
      }
    }
  }
}
