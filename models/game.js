/**
 * Connect to our data source and expose API end points
 * for this model.
 * 
 */

const EventUtils = require('../common/lib/eventutils.js');
const app = require('@apiserver/modelserver');

const Game = function (model) {
    const eventUtils = new EventUtils();

    model.gamerDetail = async function (gameid) {
        console.log("getting gamer map for game " + gameid);

        const eventrecord = await model.findById(gameid)
            .catch((e) => {
                const str = "Could not find game id " + gameid;
                console.error(str);
                throw new Error(str);
            });

        const game = eventrecord.attributes;

        // now get all the player ids
        const gamerpicks = game.gamers;

        console.log("gamer picks:" + JSON.stringify(gamerpicks));

        const Gamer = app.getModel('Gamer');

        const gamers = await Gamer.findAll()
            .catch((e) => {
                const str = "Could not find gamers";
                console.error(str);
                throw new Error(str);
            });

        // merge the gamer pick data with the gamer record
        const mergedPicks = [];

        for (let i = 0; i < gamerpicks.length; i++) {
            for (let j = 0; j < gamers.length; j++) {
                if (gamerpicks[i].user === gamers[j].id) {
                    const gamer = gamers[j].attributes;
                    gamer.user = gamerpicks[i].user;
                    gamer.picks = gamerpicks[i].picks;

                    mergedPicks.push(gamer);
                    break;
                }
            }
        }

        game.gamers = mergedPicks;

        return game;
    }

    model.gamers = async function (id) {
        console.log("getting gamers for game " + id);

        const eventrecord = await model.findById(id)
            .catch((e) => {
                const str = "Could not find game id " + id;
                console.error(str);
                throw new Error(str);
            });

        var game = eventrecord.attributes;

        if (!game.gamers) {
            var str = "No gamers found in this game object!";

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

    // [djb 5/20/2019] added timezone possibility for tee times
    //
    // see if the round score is actually a tee time in the format
    // hh:mm [am|pm] or hh:mm [am|pm] [TZ]
    var isValidTeeTime = function (timeStr) {
        var timePat = /^(\d{1,2})(:(\d{2}))?(\s?(AM|am|PM|pm))?(\s?([A-Z][A-Z]))?$/;
        var matchArray = timeStr.match(timePat);

        return matchArray != null;
    };

    // [djb 7/29/2016] changes in the way the back end provider handles
    //                 scoring made me change the method for finding the
    //                 score for rounds in progress.  We now look at
    //                 the "thru" key to see if the round is in progress
    // look at today's score and figure out if round is in progress
    var findTodayScoreIndex = function (pick, rounds) {
        var todayScore = pick['today'];
        var thru = pick['thru'];
        var rnd;
        var today = -1;

        var inProgress = (eventUtils.isNumber(thru) && thru < 18) ? true : false;

        if (inProgress && todayScore != "-") {
            // round is in progress, find first round without a valid score
            for (rnd = 0; rnd < rounds.length; rnd++) {
                if (!eventUtils.isValidScore(rounds[rnd])) {
                    today = rnd;
                    break;
                }
            }

            console.debug("round is in progress, using today index of " + rnd +
                " rounds of " + JSON.stringify(rounds));
        }

        return today;
    };

    var getCurrentScores = function (rounds, top5, enforceCutLine) {
        var currentscores = [];
        var j, k;

        for (j = 0; j < rounds; j++) {
            var net = 0;

            for (k = 0; k < Math.min(5, top5[j].length); k++) {
                net += top5[j][k]
            };

            var val = (top5[j].length == 0) ? "-" : eventUtils.formatNetScore(net);

            if (enforceCutLine) {
                // djb [08/09/2014] if there are less than 5 valid scores,
                // then this gamer has "missed the cut" and therefore the
                // scores don't count
                //
                // djb [04/09/2015] don't look at first two rounds since
                // there is no cut yet
                if (j > 1 && top5[j].length > 0 && top5[j].length < 5) {
                    console.log("Round " + (j + 1) + " top 5 has only " +
                        top5[j].length + " valid scores.");
                    val = "MC";
                }
            }
            currentscores.push(val);
        }

        return currentscores;
    };

    //
    // convert the raw round data into a round total in net format
    // e.g. 72 on a par 72 is a net of 0, 71 net of -1, 73 net of +1, etc.
    // special case is a round in progress - see findTodayScoreIndex
    //
    // isLiveScoring - indicates the data has hole-by-hole live scoring information
    //                 vs. net totals for complete rounds
    //
    var getRoundNetTotals = function (courseInfo, roundStartedData, pick, isLiveScoring) {

        console.debug("getRoundTotals: isLiveScoring=" + isLiveScoring);

        var rounds = [],
            par = [],
            roundtotals = [];
        var i;

        for (i = 0; i < courseInfo.length; i++) {
            var roundNumber = i + 1;

            roundNumber = roundNumber.toString();

            var score = pick[roundNumber];

            // djb [04-07-2017] more changes due to back end pga site differences
            if (!score) {
                score = "-";
            }
            rounds.push(score);

            par.push(courseInfo[i].par);
            roundtotals.push("-");
        }

        var todayScore = (isLiveScoring) ? pick["today"] : "";
        var todayIndex = (isLiveScoring) ? findTodayScoreIndex(pick, rounds) : -1;
        var roundtotal = 0;
        var j;

        console.debug("getRoundTotals: todayIndex=" + todayIndex);

        for (j = 0; j < rounds.length; j++) {

            // scores can include non numeric values, like "MC" for missed cut
            // so check the validity of the score before trying to use it
            if (todayIndex == j) {
                var net = eventUtils.parseNetScore(todayScore);

                roundtotal += net;

                roundtotals[j] = roundtotal;
            } else if (eventUtils.isValidScore(rounds[j])) {
                var net = parseInt(rounds[j]) - par[j];

                roundtotal += net;

                roundtotals[j] = roundtotal;
            } else {
                // djb [08/08/2014]
                // look for case where the 2nd/3rd/4th round is in progress, but player hasn't started yet
                // only take rounds where the score is a tee time to avoid WDs, MCs, etc.

                if (j > 0 && (isValidTeeTime(rounds[j]) || rounds[j] == '-') && roundStartedData[j]) {

                    // take yesterday's total
                    roundtotals[j] = roundtotals[j - 1];

                    console.log("In progress round, player " + pick.name +
                        " hasn't started (" + rounds[j] + ").  Putting in " +
                        roundtotals[j] + " score.");

                } else {
                    if (isValidTeeTime(rounds[j])) {
                        roundtotals[j] = "-"; // round hasn't started yet, just display a -
                    } else {
                        // no valid score, might be MC, WD, etc. - make that the total here
                        roundtotals[j] = rounds[j];
                    }
                }
            }

        }

        console.debug("getRoundNetTotals: pick " + JSON.stringify(pick) +
            " roundtotals = " + JSON.stringify(roundtotals));

        return roundtotals;
    };

    var updateTop5 = function (roundtotal, top5) {
        var splicePos = top5.length;
        var k;

        if (!isNaN(roundtotal)) {

            for (k = 0; k < top5.length; k++) {
                if (roundtotal < top5[k]) {
                    splicePos = k;
                    break;
                }
            }
            top5.splice(splicePos, 0, roundtotal);
        }

        return top5;
    };

    // pretty print totals into display form
    var formatTotals = function (totals) {
        var fmt = [];
        var j;

        for (j = 0; j < totals.length; j++) {
            var net = totals[j];
            var val = (isNaN(net)) ? "-" : eventUtils.formatNetScore(net);
            fmt.push(val);
        }
        return fmt;
    };

    //
    // build a data structure like the following:
    // an array of gamers, with their picks, totals, and scores
    // each pick is an array of golfers with their round scores
    // all scores are stored and formatted as net to par,
    // e.g. E for even, -1 for 1 under, +2 for 2 over, a dash ("-")
    // when there is no score (either due to missed cut or round not
    // yet completed
    //
    //  [ { "name" : "Don Boulia", "objectId" : "c0323-234234-234234-2343"
    //	  "picks"  : [ { "name" : "Tiger Woods", "rounds" : [ "+1", "E", "-3", "-5"]}...],
    //	  "totals" : [ "+1", "+5", "E", "-1"],
    //	  "scores" : [ "+1", "E", "-3 ... ] }, ... ]

    const getScores = function (courseInfo, roundStartedData, players, scoreType) {

        var details = [];
        var enforceCutLine = false;
        var isLiveScoring = false;
        var pndx, i, j;

        if (scoreType == "pga-live-scoring") {
            console.log("Scoring format is: live scoring with cut line");

            enforceCutLine = true;
            isLiveScoring = true;
        } else {
            console.log("Scoring format is: round net total with no cut line");
        }

        for (pndx = 0; pndx < players.length; pndx++) {
            var playerDetails = {};

            playerDetails.name = players[pndx].user.name;
            playerDetails.objectId = players[pndx].user.id;
            playerDetails.picks = [];
            playerDetails.totals = [];
            playerDetails.scores = [];

            var totals = [];
            var top5 = [];

            for (i = 0; i < roundStartedData.length; i++) {
                totals.push("-");
                top5.push([]);
            }

            var picks = players[pndx].picks;

            for (let i = 0; i < picks.length; i++) {
                var pickDetail = {};

                pickDetail.name = picks[i].name;
                pickDetail.rounds = [];

                var roundtotals = getRoundNetTotals(courseInfo,
                    roundStartedData, picks[i], isLiveScoring);

                for (j = 0; j < roundtotals.length; j++) {
                    var displayVal = roundtotals[j];

                    if (eventUtils.isValidNetScore(roundtotals[j])) {
                        displayVal = eventUtils.formatNetScore(roundtotals[j]);

                        // if this is the first valid score, then initialize
                        // the totals for this round
                        if (totals[j] == "-") totals[j] = 0;

                        // update our running totals and top5 list
                        totals[j] += roundtotals[j];
                        top5[j] = updateTop5(roundtotals[j], top5[j]);
                    } else {
                        console.debug("returning non score value " + displayVal + "(round " + (j + 1) + ") for player " + picks[i].name);
                    }

                    // debug
                    //				displayVal += " (" + roundtotals[j] + ")";

                    pickDetail["rounds"].push(displayVal);

                }

                playerDetails["picks"].push(pickDetail);
            }

            console.log("Top5 scores for " + playerDetails["name"] + " : " + JSON.stringify(top5));

            var currentscores = getCurrentScores(totals.length, top5, enforceCutLine);

            playerDetails["totals"] = formatTotals(totals);
            playerDetails["scores"] = currentscores;
            details.push(playerDetails);
        }

        return details;
    };

    // fill in each player's picks with the scores
    // from this event
    var expandPicks = function (picks, scores) {
        var pickscores = [];

        for (var j = 0; j < picks.length; j++) {
            for (var i = 0; i < scores.length; i++) {
                if (scores[i].player_id == picks[j].id) {
                    pickscores.push(scores[i]);
                    break;
                }
            }
        }

        console.debug("expandPicks: " + JSON.stringify(pickscores));

        return pickscores;
    };

    var roundMax = function (gamers) {
        // calculate the round leaders for each round
        //
        // [06/10/2014] fixed a bug where roundmax was initially loaded with zero
        // find the max score in each round, start with first player
        var roundmax = [];
        for (var j = 0; j < gamers[0].scores.length; j++) {
            var score = eventUtils.parseNetScore(gamers[0].scores[j]);
            roundmax[j] = (isNaN(score)) ? "" : eventUtils.parseNetScore(gamers[0].scores[j]);
        }

        gamers.forEach(function (gamer) {
            for (var j = 0; j < gamer.scores.length; j++) {
                var score = eventUtils.parseNetScore(gamer.scores[j]);
                if (!isNaN(score) && (roundmax[j] > score)) { // lower is better, this is golf
                    roundmax[j] = score;
                }
            }
        });

        return roundmax;
    }

    //
    // adds an array called "rounds" to each gamer. each array element
    // contains two fields - their score, and a boolean indicating if they are
    // the round leader
    //
    var addRoundLeaders = function (gamers) {
        var str = "";

        if (gamers.length > 0) {

            var roundmax = roundMax(gamers);

            console.debug("Max for rounds: " + JSON.stringify(roundmax));

            // now do the leaderboard
            gamers.forEach(function (gamer) {

                gamer.rounds = [];

                for (var j = 0; j < gamer.scores.length; j++) {
                    var score = gamer.scores[j];

                    // [06/21/2015] roundmax is a net score, so compare to that when
                    // determining round leader
                    var netScore = eventUtils.parseNetScore(score);

                    if (!isNaN(netScore) && (netScore == roundmax[j])) {
                        gamer.rounds[j] = {
                            score: score,
                            leader: true
                        };
                    } else {
                        gamer.rounds[j] = {
                            score: score,
                            leader: false
                        };
                    }
                }
            });
        }

        return gamers;
    };

    /**
     * return the leaderboard information
     * 
     * @param {String} id event id
     * @returns 
     */
    model.leaderboard = async function (id) {
        const gamerecord = await model.findById(id)
            .catch((e) => {
                var str = "Could not find game id " + id;
                console.error(str);
                throw new Error(str);
            });

        const game = gamerecord.attributes;
        const eventid = game.event;
        console.log(`found event ${eventid}for game ${id}`);

        const Event = app.getModel('Event');
        const event = await Event.deepGet(eventid)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            });

        console.log("found event id " + eventid);

        const golfers = event.golfers;
        const courseInfo = event.courseInfo;

        console.log('loadLeaderboard: ', courseInfo);

        let gamers = game.gamers;
        const leaderboard = {
            name: event.name,
            courseInfo: courseInfo,
            gamers: null
        };

        if (gamers) {
            const roundStatus = eventUtils.roundStatus(golfers, event.rounds.length);
            console.log("Rounds started: " + JSON.stringify(roundStatus));

            var gamer_ids = [];

            if (!gamers) console.error("processLeaderboardData: invalid gamers object!");

            gamers.forEach(function (gamer) {
                console.debug("picks: " + JSON.stringify(gamer.picks));
                gamer.picks = expandPicks(gamer.picks, golfers);
                gamer_ids.push(gamer.user);
            });

            // now go load the user info for each of the gamers
            const Gamer = app.getModel('Gamer');

            const users = await Gamer.findByIds(gamer_ids)
                .catch((e) => {
                    var str = "Could not find gamer ids " + JSON.stringify(gamer_ids);
                    console.error(str);
                    throw new Error(str);
                });

            var validgamers = [];

            users.forEach(function (user) {
                gamers.forEach(function (gamer) {
                    if (user.id == gamer.user) {
                        //			  		alert("found match for " + object.objectId);
                        user.attributes.id = user.id;
                        gamer.user = user.attributes;

                        // only keep those we can find a valid user object for...
                        validgamers.push(gamer);
                    }
                });
            });

            console.debug("validgamers: " + JSON.stringify(validgamers));

            gamers = getScores(courseInfo, roundStatus, validgamers, event.scoreType);
            gamers = addRoundLeaders(gamers);

            leaderboard.gamers = gamers;
        }

        return leaderboard;
    };

    // expose the create, read, update methods from this model
    model.addCrudMethods();

    // add any additional entry points here
    model.method(
        '/:id/Gamers',
        'GET',
        {
            description: "Get all gamers playing this game",
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
                },
            ]
        },
        model.gamers
    );

    model.method(
        '/:id/withGamerDetail',
        'GET',
        {
            description: "Get the specified game with gamer details included",
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
                },
            ],
        },
        model.gamerDetail
    );


    model.method(
        '/:id/Gamers/:gamerid/picks',
        'GET',
        {
            description: "Get a gamer's picks for this game.",
            responses: [
                {
                    code: 200,
                    description: "a picks object with an array of picks for this gamer"
                }
            ],
            params: [
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
            ]
        },
        model.getGamerPicks
    );

    model.method(
        '/:id/Gamers/:gamerid/picks',
        'POST',
        {
            description: "Update a gamer's picks for this game.",
            responses: [
                {
                    code: 200,
                    description: "The updated picks"
                }
            ],
            params: [
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
            ]
        },
        model.updateGamerPicks
    );

    model.method(
        '/:id/leaderboard',
        'GET',
        {
            description: "Get the leaderboard for this game",
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
                },
            ]
        },
        model.leaderboard
    );
}

module.exports = Game;