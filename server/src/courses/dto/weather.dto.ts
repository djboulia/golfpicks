export class WeatherDto {
  temp: number;
  wind: number;
  icon: string;
  metric: {
    temp: number;
    wind: number;
  };
}
