// interfaces for our backend

export interface Hole {
    yardage: number,
    par: number,
    number: number,
    handicap: number
}

export interface Coordinates {
    lat: number,
    lng: number
}

export interface Weather {
    temp: number,
    wind: number,
    icon: string,
    metric: {
        temp: number,
        wind: number
    }
}

export interface CourseAttributes {
    name: string,
    par: number,
    yardage: number,
    location: Coordinates,
    tee: string,
    rating: number,
    slope: number,
    holes: Hole[],
}

export interface Course {
    className: string,
    id: string,
    attributes: CourseAttributes
}
