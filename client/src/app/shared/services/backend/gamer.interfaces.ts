// interfaces for our backend

export interface GamerAttributes {
    admin: boolean,
    username: string,
    password: string,
    name: string
}


export interface Gamer {
    className: string,
    id: string,
    attributes: GamerAttributes
}
