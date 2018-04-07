var logger = {
    debugMode: false, // turn this on to get diagnostic info

    log: function (str) {
        console.log(str);
    },
    debug: function (str) {
        if (this.debugMode) console.log("[DEBUG] " + str);
    },
    error: function (str) {
        console.error(str);
    }
};


module.exports = function (Game) {
    var scores = require('../lib/scores.js');
    var app = require('../../server/server');

    Game.gamers = function (id, cb) {

        console.log("getting picks for game " + id);

        Game.findById(id, function (err, eventrecord) {
            if (!err && eventrecord) {

                var game = eventrecord.attributes;

                if (!game.gamers) {
                    var str = "No picks found in this game object!";

                    logger.error(str);
                    cb(str, null);

                    return;
                }

                logger.log("Found gamers: " + JSON.stringify(game.gamers));

                cb(null, game.gamers);

            } else {
                if (!eventrecord) {
                    var str = "Could not find game id " + id;
                    logger.error(str);
                    cb(str, null);
                } else {
                    logger.error("Error!" + JSON.stringify(err));
                    cb(err, null);
                }
            }
        });

    };

    Game.getGamerPicks = function (id, gamerid, cb) {

        console.log("getting picks for game " + id + " and gamer " + gamerid);

        Game.findById(id, function (err, eventrecord) {
            if (!err && eventrecord) {

                var game = eventrecord.attributes;

                if (!game.gamers) {
                    var str = "No picks found in this game object!";

                    logger.error(str);
                    cb(str, null);

                    return;
                }

                var gamers = game.gamers;

                logger.log("Found gamers: " + JSON.stringify(gamers));

                for (var i=0; i<gamers.length; i++) {
                    var gamer = gamers[i];

                    if (gamer.user == gamerid) {

                        logger.log("Found gamer: " + JSON.stringify(gamer));

                        cb(null, {picks: gamer.picks});
                        return;
                    }
                }

                var str = "Picks for gamer id " + gamerid + " not found";

                logger.error(str);
                cb(str, null);

            } else {
                if (!eventrecord) {
                    var str = "Could not find game id " + id;
                    logger.error(str);
                    cb(str, null);
                } else {
                    logger.error("Error!" + JSON.stringify(err));
                    cb(err, null);
                }
            }
        });

    };

    Game.updateGamerPicks = function (id, gamerid, picks, cb) {

        console.log("updateGamerPicks: getting picks for game " + id + " and gamer " + gamerid);
        console.log("body contents: " + JSON.stringify(picks));

        Game.findById(id, function (err, eventrecord) {
            if (!err && eventrecord) {

                var game = eventrecord.attributes;

                if (!game.gamers) {
                    game.gamers = [];
                }

                var gamers = game.gamers;

                logger.log("Found gamers: " + JSON.stringify(gamers));

                // find the gamer to see if this is an update of existing picks
                var gamerEntry = -1;

                for (var i=0; i<gamers.length; i++) {
                    var gamer = gamers[i];

                    if (gamer.user == gamerid) {

                        logger.log("Found gamer: " + JSON.stringify(gamer));

                        gamerEntry = i;
                        break;
                    }
                }

                if (gamerEntry<0) {
                    // no prior picks for this user, add this as a new entry
                    logger.log("Adding gamer picks for user: " + gamerid);

                    gamers.push( { user: gamerid, picks: picks} );
                } else {
                    gamers[i].picks = picks;
                }

                logger.log("updating db with the following: " + JSON.stringify(eventrecord));

                Game.upsert(eventrecord, function(err, obj) {
                    if (!err) {
                        logger.log("update successful!");
                        cb(null, {picks: game.gamers});
                    } else {
                        logger.error("Error!" + JSON.stringify(err));
                        cb(err, null);
                    }
                });

            } else {
                if (!eventrecord) {
                    var str = "Could not find game id " + id;
                    logger.error(str);
                    cb(str, null);
                } else {
                    logger.error("Error!" + JSON.stringify(err));
                    cb(err, null);
                }
            }
        });

    };


    Game.remoteMethod(
        'gamers', {
            http: {
                path: '/:id/Gamers',
                verb: 'get'
            },
            description: 'Get all picks for this game',

            accepts: [
                {
                    arg: 'id',
                    type: 'string',
                    required: true
                }
            ],
            returns: {
                arg: 'gamers',
                type: 'object',
                root: true
            }
        }
    );

    Game.remoteMethod(
        'getGamerPicks', {
            http: {
                path: '/:id/Gamers/:gamerid/picks',
                verb: 'get'
            },
            description: 'Get picks for an individual gamer',

            accepts: [
                {
                    arg: 'id',
                    type: 'string',
                    required: true
                },
                {
                    arg: 'gamerid',
                    type: 'string',
                    required: true
                }
            ],
            returns: {
                arg: 'picks',
                type: 'object',
                root: true
            }
        }
    );

    Game.remoteMethod(
        'updateGamerPicks', {
            http: {
                path: '/:id/Gamers/:gamerid/picks',
                verb: 'post'
            },
            description: 'Update picks for an individual gamer',

            accepts: [
                {
                    arg: 'id',
                    type: 'string',
                    required: true
                },
                {
                    arg: 'gamerid',
                    type: 'string',
                    required: true
                },
                {
                    arg: 'picks',
                    type: 'array',
                    http: { source: 'body' },
                    required: true
                }
            ],
            returns: {
                arg: 'picks',
                type: 'object',
                root: true
            }
        }
    );};
