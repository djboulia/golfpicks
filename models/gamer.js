/**
 * Connect to our data source and expose API end points
 * for this model.
 *
 */

const GameUtils = require('../common/lib/gameutils.js');
const app = require('@apiserver/modelserver');

const Gamer = function (model) {

    const gameUtils = new GameUtils();

    model.login = async function (session, credentials) {
        const user = credentials.user;
        const password = credentials.password;

        console.log("logging in user " + user);

        const gamers = await model.findAll()
            .catch((err) => {
                throw new Error(err);
            })

        if (gamers) {
            var match = undefined;

            for (var i = 0; i < gamers.length; i++) {
                var gamer = gamers[i];

                if (gamer) {
                    if (gamer.username === user && gamer.password === password) {
                        match = gamer;
                    }
                }
            }

            if (match) {
                console.log('logged in user ' + user);
                session.user = user;

                return match;
            } else {
                session.user = undefined;
                throw new Error("Invalid login");
            }

        } else {
            throw new Error(err);
        }
    };

    model.currentUser = async function (session) {
        if (session.user) {
            return session.user;
        } else {
            return null;
        }
    };


    /**
     * get all games this gamer has participated in
     *
     * @param {String} id gamer id
     * @returns a list of games this gamer has played in
     */
    model.games = async function (id) {
        console.log("getting games for gamer " + id);

        const Games = app.getModel('Game');

        const games = await Games.findAll()
            .catch((err) => {
                throw new Error(err);
            });

        const gameHistory = {
            active: { // the currently active game (if any)
                inProgress: false,
                joined: false
            },
            history: [] // list of games for this user
        };

        if (!games) throw new Error('Could not find Games');

        games.forEach(function (gamerecord) {
            const gameid = gamerecord.id;
            const game = gamerecord;

            const gameDetails = gameUtils.getGameDetails(game, gameid);
            gameUtils.addGracePeriod(gameDetails, 10);

            if (!gameUtils.tournamentComplete(
                gameDetails.start,
                gameDetails.end)) {

                // make this the active game
                gameHistory.active.event = gameDetails.event;
                gameHistory.active.eventid = gameDetails.eventid;

                if (gameUtils.tournamentInProgress(
                    gameDetails.start,
                    gameDetails.end)) {

                    gameHistory.active.inProgress = true;
                }
            }

            // look through each game to see if current user is one of the players
            const gamerids = game.gamers;

            for (let j = 0; j < gamerids.length; j++) {

                if (id === gamerids[j].user) {

                    // console.log(`user ${id} participated in game ${gameid}`);

                    if (gameHistory.active.eventid == gameDetails.eventid) {
                        gameHistory.active.joined = true;
                    } else {
                        // add it to our history
                        gameHistory.history.push(gameDetails);
                    }
                }
            }
        });

        // sort the gameHistory by date
        gameHistory.history.sort(function (a, b) {
            if (a.start == b.start) {
                return 0;
            } else {
                return (a.start > b.start) ? -1 : 1;
            }
        });

        return gameHistory;
    }

    /**
     * define a pass through auth function for methods that can be called with
     * no authenticated user. (e.g. login, currentUser)
     *
     * @param {Object} context
     */
    const noAuth = async function (context) {
        return true;
    }

    // add our additional entry points here
    // order is important since this is how the methods will be displayed
    // in the API explorer, so we add the login method first

    model.method(
        '/login',
        'POST',
        {
            description: "Log in this Gamer",
            responses: [
                {
                    code: 200,
                    description: "Successful login returns this gamer's record"
                },
                {
                    code: 500,
                    description: "Invalid log in"
                }
            ],
            params: [
                {
                    name: 'session',
                    source: 'session',
                    type: 'object'
                },
                {
                    name: 'credentials',
                    source: 'body',
                    type: 'object',
                    schema: {
                        "name": 'Credentials',
                        "properties": {
                            "user": {
                                "required": true,
                                "type": 'string'
                            },
                            "password": {
                                "required": true,
                                "type": 'string'
                            }
                        }
                    }
                }
            ]
        },
        model.login,
        noAuth
    );

    model.method(
        '/currentUser',
        'GET',
        {
            description: "See if there is a current Gamer logged in",
            responses: [
                {
                    code: 200,
                    description: "Successful login returns this gamer's id"
                }
            ],
            params: [
                {
                    name: 'session',
                    source: 'session',
                    type: 'object'
                }
            ]
        },
        model.currentUser,
        noAuth
    );

    // expose the create, read, update methods from this model
    model.addCrudMethods();

    model.method(
        '/:id/Games',
        'GET',
        {
            description: "Get Games associated with this gamer",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                }
            ]
        }
        ,
        model.games
    );
}

module.exports = Gamer;