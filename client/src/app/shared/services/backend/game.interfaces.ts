// interfaces for our backend

export interface GameAttributes {
    name: string,
    start: string,
    end: string,
    event: string,
    gamers: any[]
}


export interface Game {
    className: string,
    id: string,
    attributes: GameAttributes
}
