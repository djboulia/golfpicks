console.log("loading GolfPicks.gameData");

angular.module('GolfPicks.gameData', [])
    .factory('gameData', ['$q', 'cloudDataGame', 'cloudDataEvent', 'gameUtils',
        function ($q, cloudDataGame, cloudDataEvent, gameUtils) {

            var sortByRank = function (records) {

                records.sort(function (a, b) {
                    // djb [09/04/2022] handles ties in rankings
                    var aRank = (a.rank.startsWith('T')) ? a.rank.substr(1) : a.rank;
                    var bRank = (b.rank.startsWith('T')) ? b.rank.substr(1) : b.rank;

                    // if unranked supply a sufficiently high numbrer
                    aRank = (aRank == "-") ? 1000 : aRank;
                    bRank = (bRank == "-") ? 1000 : bRank;

                    return aRank - bRank
                });

                return records;
            };

            var loadEventData = function (eventid) {
                var deferred = $q.defer();

                cloudDataEvent.deepGet(eventid)
                    .then(function (event) {
                        console.log('event:', event);

                        deferred.resolve({
                            event: event,
                            golfers: event.golfers,
                            courseInfo: event.courseInfo
                        });
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
                    console.log('currentUser ', currentUser);
                    return currentUser.games();
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
                    return cloudDataEvent.newsfeed(eventid);
                },

                loadWeather: function (eventid) {
                    return cloudDataEvent.weather(eventid);
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
                    return cloudDataGame.withGamerDetail(gameid);
                },

                loadEvent: function (eventid) {
                    return loadEventData(eventid);
                },

                loadEventLeaders: function (eventid) {
                    return cloudDataEvent.leaders(eventid);
                },

                loadRankedPlayers: function (eventid) {
                    var deferred = $q.defer();

                    loadEventData(eventid)
                        .then(function (result) {
                            var event = result.event;
                            var golfers = result.golfers;

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

//                            console.log("players: " + JSON.stringify(players));

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

                loadLeaderboard: function (gameid) {
                    console.log('game ', gameid);
                    return cloudDataGame.leaderboard(gameid);
                }

            }
        }
    ]);