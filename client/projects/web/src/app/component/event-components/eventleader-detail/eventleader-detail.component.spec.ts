import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventLeaderDetailComponent } from './eventleader-detail.component';

describe('EventLeaderDetailComponent', () => {
  let component: EventLeaderDetailComponent;
  let fixture: ComponentFixture<EventLeaderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventLeaderDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventLeaderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
