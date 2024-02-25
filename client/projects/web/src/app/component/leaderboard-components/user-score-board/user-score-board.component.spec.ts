import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserScoreBoardComponent } from './user-score-board.component';

describe('UserScoreBoardComponent', () => {
  let component: UserScoreBoardComponent;
  let fixture: ComponentFixture<UserScoreBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserScoreBoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserScoreBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
