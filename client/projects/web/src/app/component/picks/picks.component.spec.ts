import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicksComponent } from './picks.component';

describe('PicksComponent', () => {
  let component: PicksComponent;
  let fixture: ComponentFixture<PicksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PicksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PicksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
