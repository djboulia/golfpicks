import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameplayerComponent } from './gameplayer.component';

describe('GameplayerComponent', () => {
  let component: GameplayerComponent;
  let fixture: ComponentFixture<GameplayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameplayerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
