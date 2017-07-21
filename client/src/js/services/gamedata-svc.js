console.log("loading GolfPicks.gameData");

angular.module('GolfPicks.gameData', [])
    .factory('gameData', ['$q', 'cloudDataGame', 'cloudDataEvent',
                          'cloudDataPlayer', 'gameUtils', 'eventUtils',
        function ($q, cloudDataGame, cloudDataEvent, cloudDataPlayer, gameUtils, eventUtils) {
            var logger = gameUtils.logger;

            var isNumber = function (str) {
                var result = parseInt(str);
                return !isNaN(result);
            };

            var sortByRank = function (records) {

                records.sort(function (a, b) {
                    // if unranked supply a sufficiently high numbrer
                    var aRank = (a.rank == "-") ? 1000 : a.rank;
                    var bRank = (b.rank == "-") ? 1000 : b.rank;
                    return aRank - bRank
                });

                return records;
            };

            // see if the round score is actually a tee time in the format
            // hh:mm [am|pm]
            var isValidTeeTime = function (timeStr) {
                var timePat = /^(\d{1,2}):(\d{2})?(\s?(AM|am|PM|pm))?$/;
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
                            logger.log("Round " + (j + 1) + " top 5 has only " +
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

                logger.debug("getRoundTotals: isLiveScoring=" + isLiveScoring);

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

                logger.debug("getRoundTotals: todayIndex=" + todayIndex);

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

                        if (j > 0 && isValidTeeTime(rounds[j]) && roundStartedData[j]) {

                            // take yesterday's total
                            roundtotals[j] = roundtotals[j - 1];

                            logger.log("In progress round, player " + pick.name +
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

                logger.debug("getRoundNetTotals: pick " + JSON.stringify(pick) +
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

            var getScores = function (courseInfo, roundStartedData, players, scoreType) {

                var details = [];
                var enforceCutLine = false;
                var isLiveScoring = false;
                var pndx, i, j;

                if (scoreType == "pga-live-scoring") {
                    logger.log("Scoring format is: live scoring with cut line");

                    enforceCutLine = true;
                    isLiveScoring = true;
                } else {
                    logger.log("Scoring format is: round net total with no cut line");
                }

                for (pndx = 0; pndx < players.length; pndx++) {
                    var playerDetails = {};

                    playerDetails.name = players[pndx].user.name;
                    playerDetails.objectId = players[pndx].user._id;
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

                    for (i = 0; i < picks.length; i++) {
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
                                logger.debug("returning non score value " + displayVal + "(round " + (j + 1) + ") for player " + picks[i].name);
                            }

                            // debug					
                            //				displayVal += " (" + roundtotals[j] + ")";

                            pickDetail["rounds"].push(displayVal);

                        }

                        playerDetails["picks"].push(pickDetail);
                    }

                    logger.log("Top5 scores for " + playerDetails["name"] + " : " + JSON.stringify(top5));

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

                logger.debug("expandPicks: " + JSON.stringify(pickscores));

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

                    logger.debug("Max for rounds: " + JSON.stringify(roundmax));

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

            var getWatsonScores = function (game, event, golfers, courseInfo) {
                console.log("watson data is: " + JSON.stringify(game.watson));

                //
                // djb [07/14/2016] add Watson to the game if data is available!
                //
                if (game.watson) {
                    var roundStatus = eventUtils.roundStatus(golfers, event.rounds.length);

                    // fill in watson picks
                    var picks = expandPicks(game.watson.picks, golfers);
                    console.log("picks: " + JSON.stringify(picks));

                    // fluff up watson into an array which getScores expects
                    var watsonArray = [{
                        user: {
                            name: "Watson"
                        },
                        picks: picks
                                }];
                    watsonArray = getScores(courseInfo, roundStatus, watsonArray, event.scoreType);
                    return watsonArray[0]; // first element is watson's score
                }

                return null;

            };

            var processLeaderboardData = function (game, event, golfers, courseInfo) {
                var gamers = game.gamers;
                var deferred = $q.defer();

                if (gamers) {

                    var roundStatus = eventUtils.roundStatus(golfers, event.rounds.length);
                    logger.log("Rounds started: " + JSON.stringify(roundStatus));

                    var gamer_ids = [];

                    if (!gamers) logger.error("processLeaderboardData: invalid gamers object!");

                    gamers.forEach(function (gamer) {
                        logger.debug("picks: " + JSON.stringify(gamer.picks));
                        gamer.picks = expandPicks(gamer.picks, golfers);
                        gamer_ids.push(gamer.user);
                    });

                    // now go load the user info for each of the gamers
                    cloudDataPlayer.getList(gamer_ids)
                        .then(function (users) {
                                var validgamers = [];

                                users.forEach(function (user) {
                                    gamers.forEach(function (gamer) {
                                        if (user._id == gamer.user) {
                                            //			  		alert("found match for " + object.objectId);
                                            gamer.user = user;

                                            // only keep those we can find a valid user object for...
                                            validgamers.push(gamer);
                                        }
                                    });
                                });

                                logger.debug("validgamers: " + JSON.stringify(validgamers));

                                gamers = getScores(courseInfo, roundStatus, validgamers, event.scoreType);
                                gamers = addRoundLeaders(gamers);

                                var watson = getWatsonScores(game, event, golfers, courseInfo);
                                console.log("watson scores: " + JSON.stringify(watson));

                                deferred.resolve({
                                    name: event.name,
                                    courseInfo: courseInfo,
                                    gamers: gamers,
                                    watson: watson
                                });
                            },
                            function (err) {
                                deferred.reject(err);
                            });
                } else {
                    // no players playing in this event, so no leaderboard info
                    deferred.resolve({
                        name: event.name,
                        courseInfo: courseInfo,
                        gamers: null
                    });
                }

                return deferred.promise;
            };

            var loadEventData = function (eventid) {
                var deferred = $q.defer();

                cloudDataEvent.get(eventid)
                    .then(function (event) {
                            var courseInfo = eventUtils.courses(event);

                            logger.debug("entering loadEventData courseInfo :" + JSON.stringify(courseInfo));

                            logger.log("scoreType = " + event.scoreType);

                            // There are multiple types of scoring systems
                            // For non PGA events, the scores are contained directly in
                            // the event record.  For PGA events, we need to load the
                            // live scoring data from the tour site

                            if (event.scoreType == "pga-live-scoring") {

                                // go get the golfer scores from the remote service
                                cloudDataEvent.scores(eventid).then(
                                    function (tournament) {
                                        logger.log("got scores!");

                                        logger.debug("loadEventData courseInfo :" + JSON.stringify(courseInfo));

                                        deferred.resolve({
                                            event: event,
                                            golfers: tournament.scores,
                                            courseInfo: courseInfo
                                        });
                                    },
                                    function (err) {
                                        deferred.reject(err);
                                    });

                            } else {
                                // match up scores and players
                                var golfers = eventUtils.golfers(event);

                                deferred.resolve({
                                    event: event,
                                    golfers: golfers,
                                    courseInfo: courseInfo
                                });
                            }

                        },
                        function (err) {
                            deferred.reject(err);
                        });

                return deferred.promise;
            };

            return {

                //
                // loadUserGameHistory:
                //
                // builds a history of games this user has participated in
                // in addition to a simple list of games, it flags the currently "active"
                // game, defined either as the game in progress, or a game that has not
                // yet started
                //
                // if there are no active games, this will be blank
                //
                loadUserGameHistory: function (currentUser) {
                    var deferred = $q.defer();
                    var logger = gameUtils.logger;

                    cloudDataGame.getAll()
                        .then(function (games) {

                                logger.debug(JSON.stringify(games));

                                var gameHistory = {
                                    active: { // the currently active game (if any)
                                        inProgress: false,
                                        joined: false
                                    },
                                    history: [] // list of games for this user
                                };

                                games.forEach(function (game) {

                                    var gameDetails = gameUtils.getGameDetails(game);
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
                                    var gamerids = game.gamers;

                                    for (var j = 0; j < gamerids.length; j++) {

                                        if (currentUser.getId() == gamerids[j].user) {

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

                                // return game history
                                deferred.resolve(gameHistory);
                            },
                            function (err) {
                                logger.error("Couldn't access game information!");

                                deferred.reject(err);
                            });

                    return deferred.promise;
                },

                //
                // loadGames:
                //
                // returns a list of all games in the back end store
                //
                loadGames: function () {
                    var deferred = $q.defer();
                    var logger = gameUtils.logger;

                    cloudDataGame.getAll()
                        .then(function (games) {
                                logger.debug(JSON.stringify(games));

                                // sort the games by date
                                games.sort(function (a, b) {
                                    var aDate = Date.parse(a.start);
                                    var bDate = Date.parse(b.start);

                                    if (aDate == bDate) {
                                        return 0;
                                    } else {
                                        return (aDate > bDate) ? -1 : 1;
                                    }
                                });

                                // return game list
                                deferred.resolve(games);
                            },
                            function (err) {
                                logger.error("Couldn't access game information!");

                                deferred.reject(err);
                            });

                    return deferred.promise;
                },


                loadNewsFeed: function (eventid) {
                    var deferred = $q.defer();

                    loadEventData(eventid)
                        .then(function (result) {
                                var event = result.event;
                                var golfers = result.golfers;
                                var courseInfo = result.courseInfo;

                                var feedItems = [];
                                var currentRound = eventUtils.getCurrentRoundInProgress(golfers, event.rounds.length);

                                if (currentRound > 0) {

                                    var roundNumber = new String(currentRound);
                                    var totalPar = 0;

                                    for (var i = 0; i < currentRound; i++) {
                                        totalPar += courseInfo[i].par;
                                    }

                                    // console.debug("total par: " + totalPar + ", currentRound: " + currentRound);
                                    // console.debug(JSON.stringify(golfers));

                                    //TODO: need to fix this for non PGA events
                                    var isPGA = true;
                                    if (isPGA) {
                                        // First entry is the tournament leader; return this and all ties
                                        //                                    var score = golfers[0].strokes;
                                        //                                    var netScore = score - totalPar;

                                        var leaders = eventUtils.tournamentLeaders(golfers);
                                        var text = (leaders.length > 1) ? "Tournament leaders" : "Tournament leader";

                                        feedItems.push(text);

                                        for (var i = 0; i < leaders.length; i++) {
                                            var leader = leaders[i];

                                            feedItems.push(leader.name + " " + leader.total);
                                        }

                                        var roundLeaders = eventUtils.roundLeaders(golfers, courseInfo);
                                        logger.log("roundLeaders: " + JSON.stringify(roundLeaders));

                                        if (roundLeaders[currentRound - 1].length > 0) {
                                            var leaders = roundLeaders[currentRound - 1];

                                            var text = "Day " + currentRound + " low scores";

                                            feedItems.push(text);

                                            for (var i = 0; i < leaders.length; i++) {
                                                var leader = leaders[i];

                                                feedItems.push(leader.name + " " + leader.score);
                                            }
                                        }

                                        //                                    // find lowest rounds for current round by sorting the round scores
                                        //                                    golfers.sort(function (a, b) {
                                        //                                        return a[roundNumber] - b[roundNumber];
                                        //                                    });
                                        //
                                        //                                    // First entry is the leader; return round leader and all ties
                                        //                                    score = golfers[0][roundNumber];
                                        //                                    netScore = score - courseInfo[currentRound].par;
                                        //
                                        //                                    feedItems.push("Round " + roundNumber +
                                        //                                        " (" + courseInfo[currentRound].name + ") low rounds");
                                        //
                                        //                                    for (var i = 0; i < golfers.length; i++) {
                                        //                                        var golfer = golfers[i];
                                        //                                        if (golfer[roundNumber] == score) {
                                        //                                            feedItems.push(golfer.name + " " + score +
                                        //                                                " (" + eventUtils.formatNetScore(netScore) + ")");
                                        //                                        }
                                        //                                    }
                                    }

                                }

                                deferred.resolve(feedItems)
                            },
                            function (err) {
                                deferred.reject(err);
                            });

                    return deferred.promise;
                },

                loadGame: function (gameid) {

                    // load the current game
                    // the EVENT holds the golfers
                    // the GAME is the game played based on the golfer's scores

                    return cloudDataGame.get(gameid);
                },

                //
                // loadGameWithGamers:
                //
                // returns the given game and a hashmap of the gamers
                //
                loadGameWithGamers: function (gameid) {
                    var deferred = $q.defer();

                    var logger = gameUtils.logger;
                    var game;

                    this.loadGame(gameid)
                        .then(function (result) {
                            game = result;

                            // now get all the player ids
                            var gamerlist = [];
                            var gamerids = game.gamers;

                            for (var i = 0; i < gamerids.length; i++) {
                                gamerlist.push(gamerids[i].user);
                            }

                            logger.log("gamer list:" + JSON.stringify(gamerlist));

                            return cloudDataPlayer.getAll();
                        })
                        .then(function (gamers) {

                            // turn the list into a hashmap by id
                            var gamerMap = {};

                            for (var i = 0; i < gamers.length; i++) {
                                gamerMap[gamers[i]._id] = gamers[i];
                            }

                            logger.log("returning map: " + JSON.stringify(gamers));

                            deferred.resolve({
                                game: game,
                                gamerMap: gamerMap
                            });
                        })
                        .catch(function (err) {
                            deferred.reject(err);
                        });

                    return deferred.promise;
                },

                loadEvent: function (eventid) {
                    return loadEventData(eventid);
                },

                loadRankedPlayers: function (eventid) {
                    var deferred = $q.defer();

                    loadEventData(eventid)
                        .then(function (result) {
                                var event = result.event;
                                var golfers = result.golfers;
                                var courseInfo = result.courseInfo;

                                var players = [];

                                for (var i = 0; i < golfers.length; i++) {
                                    var golfer = golfers[i];

                                    players.push({
                                        name: golfer.name,
                                        rank: golfer.rank,
                                        player_id: golfer.player_id,
                                        selectable: true,
                                        selected: false
                                    });
                                }

                                players = sortByRank(players);

                                for (var i = 0; i < players.length; i++) {
                                    players[i].index = i + 1;
                                }

                                deferred.resolve({
                                    event: event,
                                    golfers: players
                                });

                            },
                            function (err) {
                                deferred.reject(err);
                            });

                    return deferred.promise;
                },

                loadLeaderboard: function (game) {
                    var deferred = $q.defer();

                    // load the current event associated with this game
                    // the EVENT holds the golfers
                    // the GAME is the game played based on the golfer's scores

                    // callback expects parameters: name, courseInfo, gamers
                    var eventid = game.eventid;

                    loadEventData(eventid)
                        .then(function (result) {
                            var event = result.event;
                            var golfers = result.golfers;
                            var courseInfo = result.courseInfo;

                            return processLeaderboardData(game, event, golfers, courseInfo);
                        })
                        .then(function (result) {
                            deferred.resolve(result);
                        })
                        .catch(function (err) {
                            deferred.reject(err);
                        });

                    return deferred.promise;
                }

            }
    }]);
