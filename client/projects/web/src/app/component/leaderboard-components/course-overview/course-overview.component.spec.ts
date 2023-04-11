import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseInfoComponent } from './course-overview.component';

describe('CourseDetailsComponent', () => {
  let component: CourseInfoComponent;
  let fixture: ComponentFixture<CourseInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CourseInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
