import { TestBed } from '@angular/core/testing';

import { GameDayService } from './game-day.service';

describe('GameDayService', () => {
  let service: GameDayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameDayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
