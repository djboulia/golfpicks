import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { TemplateRef } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { CourseService } from 'src/app/shared/services/backend/course.service';
import { Course, CourseAttributes } from 'src/app/shared/services/backend/course.interface';


@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  id: any = null;
  course: any = null;

  errorMessage: any = null;
  parentUrl = '/component/courses';
  baseUrl = '/component/course';

  title = 'New Course';
  confirmButton = 'Confirm';
  deleteButton = false;
  submitButton = 'Create';
  isLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private courseApi: CourseService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    console.log(`id: ${this.id}`);

    if (this.id) {
      // edit an existing user
      const self = this;

      this.title = 'Update Course';
      this.deleteButton = true;
      this.submitButton = 'Save';

      // go get this user's record
      this.courseApi.get(this.id)
        .subscribe({
          next(data) {
            console.log('data ', data);

            if (!data) {
              self.errorMessage = "Error loading course!";
              self.isLoaded = false;  
            } else {
              self.course = data;
              self.isLoaded = true;
            }
          },
          error(msg) {
            console.log('error getting course!! ', msg);

            self.errorMessage = "Error loading course!";
            self.isLoaded = false;
          }
        });
    } else {
      // create a new user
      this.course = this.courseApi.newModel();
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

  onSubmit() {
    console.log('submit pressed!');

    const attributes: CourseAttributes = this.course.attributes;

    if (this.id) {
      // existing gamer, update all fields
      this.updateCourse(this.course);
    } else {
      // new gamer, only send the attributes
      this.createCourse(attributes);
    }
  }

  private deleteUser() {
    const self = this;

    this.courseApi.delete(this.id)
      .subscribe({
        next(data) {
          console.log('course deleted: ', data);

          self.router.navigate([self.parentUrl]);
        },
        error(msg) {
          console.log('error deleting course! ', msg);
          self.errorMessage = `Error deleting course ${self.course.attributes.name}!`;
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

  private updateCourse(course: Course) {
    const self = this;

    this.courseApi.put(course)
      .subscribe({
        next(data) {
          console.log('Course data saved: ', data);

          const attributes = course.attributes;
          attributes.location.lat = Number.parseFloat(attributes.location.lat.toString());            
          attributes.location.lng = Number.parseFloat(attributes.location.lng.toString());
      
          // update could have been to logged in user, so refresh the auth state
          self.auth.refresh()
            .subscribe(() => {
              console.log('refreshed course info');
              self.router.navigate([self.parentUrl]);
            })
        },
        error(msg) {
          console.log('error saving data! ', msg);
          self.errorMessage = "Error saving course data!";
        }
      });
  }

  private createCourse(attributes: CourseAttributes) {
    const self = this;

    console.log('creating course ', attributes);
    attributes.location.lat = Number.parseFloat(attributes.location.lat.toString());            
    attributes.location.lng = Number.parseFloat(attributes.location.lng.toString());

    this.courseApi.post(attributes)
      .subscribe({
        next(data) {
          console.log('course data created: ', data);

          self.router.navigate([self.parentUrl]);
        },
        error(msg) {
          console.log('error creating course! ', msg);
          self.errorMessage = "Error creating course!";
        }
      });
  }
}