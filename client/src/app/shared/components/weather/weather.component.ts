import { Component, OnInit, Input } from '@angular/core';
import { Weather } from '../../services/golfpicks/course.model';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
})
export class WeatherComponent implements OnInit {
  @Input() weather: Weather | undefined;

  constructor() {}

  ngOnInit(): void {}
}
