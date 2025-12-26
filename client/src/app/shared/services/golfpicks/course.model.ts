// interfaces for our backend

export interface Hole {
  yardage: string;
  par: string;
  number: number;
  handicap: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Weather {
  temp: number;
  wind: number;
  icon: string;
  metric: {
    temp: number;
    wind: number;
  };
}

export interface Course {
  id: string;
  name: string;
  par: number;
  yardage: number;
  location: Coordinates;
  tee: string;
  rating: number;
  slope: number;
  holes: Hole[];
}
