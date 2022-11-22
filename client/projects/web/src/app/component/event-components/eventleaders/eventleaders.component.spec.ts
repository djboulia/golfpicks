import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventLeadersComponent } from './eventleaders.component';

describe('EventLeadersComponent', () => {
  let component: EventLeadersComponent;
  let fixture: ComponentFixture<EventLeadersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventLeadersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventLeadersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
