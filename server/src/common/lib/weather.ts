import { JsonRequest } from './pgascores/jsonrequest';
import { Cache } from './cache.js';

type WeatherApiData = {
  main: {
    temp: number;
  };
  temp: number;
  wind: {
    speed: number;
  };
  weather: { icon: string }[];
};

type WeatherData = {
  temp: number;
  wind: number;
  icon: string;
  metric: {
    temp: number;
    wind: number;
  };
};

const weatherCache = new Cache<WeatherData>(10 * 60); // 10 minutes

export const weatherUrl = function (lat: number, lng: number) {
  const url =
    'http://api.openweathermap.org/data/2.5/weather?' +
    'units=imperial&lat=' +
    lat +
    '&lon=' +
    lng +
    '&appid=2667370f091820d213dc04e0c9176993';
  return url;
};

export const fahrenheitToCelsius = function (value: number) {
  return ((value - 32) * 5) / 9;
};

export const mphToKPH = function (value: number) {
  return value * 1.609344;
};

export const forecast = async function (
  lat: number,
  lng: number,
): Promise<WeatherData> {
  const url = weatherUrl(lat, lng);
  const request = new JsonRequest(url);

  console.log('weather url ' + url);

  const key = lat + ',' + lng;
  const entry = weatherCache.get(key);

  if (entry) {
    console.log('Returning cached weather ', entry);
    return entry;
  }

  // not cached, go get it
  const data = (await request.get().catch((e) => {
    console.log('weather data returned error: ' + e);
    throw e;
  })) as WeatherApiData;

  console.log('weather: ' + JSON.stringify(data));

  const main = data.main;
  const tempf = main.temp;
  const tempc = Math.round(fahrenheitToCelsius(tempf) * 100) / 100;

  const wind = data.wind;
  const windmph = wind.speed;
  const windkph = Math.round(mphToKPH(windmph) * 100) / 100;

  const weather = data.weather[0];
  const icon = 'http://openweathermap.org/img/w/' + weather.icon + '.png';

  const obj: WeatherData = {
    temp: tempf,
    wind: windmph,
    icon: icon,
    metric: {
      temp: tempc,
      wind: windkph,
    },
  };

  // save in cache for next time
  weatherCache.put(key, obj);

  return obj;
};
