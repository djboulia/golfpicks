/**
 * Connect to our data source and expose API end points
 * for this model.
 * 
 */

const scores = require('../common/lib/scores.js');
const app = require('../server/app')

const Game = function (modelServer, model) {

    model.gamers = async function (id) {
        console.log("getting picks for game " + id);

        const eventrecord = await model.findById(id)
            .catch((e) => {
                const str = "Could not find game id " + id;
                console.error(str);
                throw new Error(str);
            });

        var game = eventrecord.attributes;

        if (!game.gamers) {
            var str = "No picks found in this game object!";

            console.error(str);
            throw new Error(str);
        }

        console.log("Found gamers: " + JSON.stringify(game.gamers));

        return game.gamers;
    };

    model.getGamerPicks = async function (id, gamerid) {
        console.log("getting picks for game " + id + " and gamer " + gamerid);

        const eventrecord = await model.findById(id)
            .catch((e) => {
                const str = "Could not find game id " + id;
                console.error(str);
                throw new Error(str);
            });

        var game = eventrecord.attributes;

        if (!game.gamers) {
            var str = "No picks found in this game object!";

            console.error(str);
            throw new Error(str);
        }

        var gamers = game.gamers;

        console.log("Found gamers: " + JSON.stringify(gamers));

        for (var i = 0; i < gamers.length; i++) {
            var gamer = gamers[i];

            if (gamer.user == gamerid) {

                console.log("Found gamer: " + JSON.stringify(gamer));

                return { picks: gamer.picks }
            }
        }

        var str = "Picks for gamer id " + gamerid + " not found";
        console.error(str);
        throw new Error(str);
    };

    model.updateGamerPicks = async function (id, gamerid, picks) {
        console.log("updateGamerPicks: getting picks for game " + id + " and gamer " + gamerid);
        console.log("body contents: " + JSON.stringify(picks));

        const eventrecord = await model.findById(id)
            .catch((e) => {
                const str = "Could not find game id " + id;
                console.error(str);
                throw new Error(str);
            });

        const game = eventrecord.attributes;

        if (!game.gamers) {
            game.gamers = [];
        }

        const gamers = game.gamers;

        console.log("Found gamers: " + JSON.stringify(gamers));

        // find the gamer to see if this is an update of existing picks
        var gamerEntry = -1;

        for (var i = 0; i < gamers.length; i++) {
            var gamer = gamers[i];

            if (gamer.user == gamerid) {

                console.log("Found gamer: " + JSON.stringify(gamer));

                gamerEntry = i;
                break;
            }
        }

        if (gamerEntry < 0) {
            // no prior picks for this user, add this as a new entry
            console.log("Adding gamer picks for user: " + gamerid);

            gamers.push({ user: gamerid, picks: picks });
        } else {
            gamers[i].picks = picks;
        }

        console.log("updating db with the following: " + JSON.stringify(eventrecord));

        await model.put(eventrecord)
            .catch((e) => {
                console.error("Error!" + JSON.stringify(err));
                throw e;
            })

        console.log("update successful!");
        return { picks: game.gamers };
    };

    // expose the create, read, update methods from this model
    modelServer.addCrudMethods(model);

    // add any additional entry points here
    modelServer.method(
        '/:id/Gamers',
        'GET',
        [
            {
                name: 'id',
                source: 'param',
                type: 'string'
            },
        ],
        model.gamers
    );

    modelServer.method(
        '/:id/Gamers/:gamerid/picks',
        'GET',
        [
            {
                name: 'id',
                source: 'param',
                type: 'string'
            },
            {
                name: 'gamerid',
                source: 'param',
                type: 'string'
            },
        ],
        model.getGamerPicks
    );

    modelServer.method(
        '/:id/Gamers/:gamerid/picks',
        'POST',
        [
            {
                name: 'id',
                source: 'param',
                type: 'string'
            },
            {
                name: 'gamerid',
                source: 'param',
                type: 'string'
            },
            {
                name: 'picks',
                source: 'body',
                type: 'string'
            },
        ],
        model.updateGamerPicks
    );

}

module.exports = Game;