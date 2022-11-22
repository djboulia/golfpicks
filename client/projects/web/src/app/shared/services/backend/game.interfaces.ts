// interfaces for our backend

export interface Game {
    id: string,
    name: string,
    start: string,
    end: string,
    event: string,
    gamers: any[]
}

export interface GameDay {
    id: string,
    name: string,
    start: string,
    end: string,
    event: string,
    gamers: any[]
    gameDay: {
        inProgress: boolean,
        complete : boolean
    }
}
