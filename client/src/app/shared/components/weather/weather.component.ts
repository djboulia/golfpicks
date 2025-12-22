import { Component, OnInit, Input } from '@angular/core';

export type Weather = {
  temp?: number;
  wind?: number;
  icon: string;
  metric: {
    temp?: number;
    wind?: number;
  };
};

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
})
export class WeatherComponent implements OnInit {
  @Input() weather: Weather | undefined;

  constructor() {}

  ngOnInit(): void {}
}
