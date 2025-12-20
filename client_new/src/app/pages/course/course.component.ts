import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ModalService } from '../../shared/services/modal.service';

import { AuthService } from '../../shared/services/auth/auth.service';
import { CourseService } from '../../shared/services/golfpicks/course.service';
import { Course } from '../../shared/services/golfpicks/course.model';
import { LoaderService } from '../../shared/services/loader.service';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { PageLoadComponent } from '../../shared/components/common/page-load/page-load.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputFieldNumericComponent } from '../../shared/components/form/input/input-field-numeric.component';
import { GAMEURLS } from '../../app.routes';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  imports: [
    ModalComponent,
    PageLoadComponent,
    InputFieldComponent,
    ButtonComponent,
    InputFieldNumericComponent,
  ],
})
export class CourseComponent implements OnInit {
  id: string | null = null;
  course: Course | undefined = undefined;

  parentUrl = GAMEURLS.courses;
  baseUrl = GAMEURLS.course;

  title = 'New Course';
  confirmButton = 'Confirm';
  deleteButton = false;
  submitButton = 'Create';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private courseApi: CourseService,
    protected deleteModal: ModalService,
    protected loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log(`id: ${this.id}`);

    this.loader.setLoading(true);

    if (this.id) {
      // edit an existing user

      this.title = 'Update Course';
      this.deleteButton = true;
      this.submitButton = 'Save';

      // go get this user's record
      this.courseApi.get(this.id).subscribe({
        next: (data) => {
          console.log('data ', data);

          if (!data) {
            this.loader.setErrorMessage('Error loading course!');
          } else {
            this.course = data;
            this.loader.setLoading(false);
          }
        },
        error: (msg) => {
          console.log('error getting course!! ', msg);

          this.loader.setErrorMessage('Error loading course!');
        },
      });
    } else {
      // create a new user
      this.course = this.courseApi.newModel();
      this.loader.setLoading(false);
    }
  }

  /**
   * confirm the delete with a modal before processing.
   *
   * @param content TemplateRef for modal
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
    this.deleteCourse();
    this.deleteModal.closeModal();
  }

  onSubmit() {
    console.log('submit pressed!');
    if (!this.course) {
      return;
    }

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

  onNameChange(newName: string | number) {
    if (!this.course) {
      return;
    }

    if (typeof newName === 'number') {
      newName = newName.toString();
    }
    this.course.name = newName;
  }

  private deleteCourse() {
    this.loader.setLoading(true);
    if (!this.id) {
      this.loader.setErrorMessage('Invalid id!');
      return;
    }

    this.courseApi.delete(this.id).subscribe({
      next: (data) => {
        console.log('course deleted: ', data);

        this.loader.setLoading(false);
        this.router.navigate([this.parentUrl]);
      },
      error: (msg) => {
        console.log('error deleting course! ', msg);
        this.loader.setErrorMessage(`Error deleting course ${this.course?.name}!`);
      },
    });
  }

  private updateCourse(course: Course) {
    this.loader.setLoading(true);

    this.courseApi.put(course).subscribe({
      next: (data) => {
        console.log('Course data saved: ', data);

        course.location.lat = Number.parseFloat(course.location.lat.toString());
        course.location.lng = Number.parseFloat(course.location.lng.toString());

        // update could have been to logged in user, so refresh the auth state
        this.auth.refresh().subscribe(() => {
          console.log('refreshed course info');

          this.loader.setLoading(false);
          this.router.navigate([this.parentUrl]);
        });
      },
      error: (msg) => {
        console.log('error saving data! ', msg);
        this.loader.setErrorMessage('Error saving course data!');
      },
    });
  }

  private createCourse(course: Course) {
    this.loader.setLoading(true);

    console.log('creating course ', course);
    course.location.lat = Number.parseFloat(course.location.lat.toString());
    course.location.lng = Number.parseFloat(course.location.lng.toString());

    this.courseApi.post(course).subscribe({
      next: (data) => {
        console.log('course data created: ', data);

        this.loader.setLoading(false);
        this.router.navigate([this.parentUrl]);
      },
      error: (msg) => {
        console.log('error creating course! ', msg);
        this.loader.setErrorMessage('Error creating course!');
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

  private updateYardage(course: Course | undefined) {
    if (!course) return;

    if (course.holes.length >= 0) {
      course.yardage = 0;

      for (let i = 0; i < course.holes.length; i++) {
        course.yardage += +course.holes[i].yardage;
      }
    }
  }
}
