// interfaces for our backend

export interface EventAttributes {
    name: string,
    start: string,
    end: string,
    season: string,
    provider: string,
    scoreType: string,
    tournament_id: string,
    rounds: []
}

export interface Event {
    className: string,
    id: string,
    attributes: EventAttributes
}

export interface Schedule {
    name: string,
    start: string,
    end: string,
    courses: [],
    provider: string,
    year: string,
    tournament_id: string
}
