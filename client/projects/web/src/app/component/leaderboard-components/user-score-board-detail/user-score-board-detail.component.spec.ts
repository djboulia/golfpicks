import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserScoreBoardDetailComponent } from './user-score-board-detail.component';

describe('LeaderboardComponent', () => {
  let component: UserScoreBoardDetailComponent;
  let fixture: ComponentFixture<UserScoreBoardDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserScoreBoardDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserScoreBoardDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
