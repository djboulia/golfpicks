console.log("loading GolfPicks.data");

angular.module('GolfPicks.data', [])
    .factory('cloudDataLog', ['cloudData', 'cloudDataCurrentUser', 'Log', function (cloudData, currentUser, model) {
        var _fieldNames = {
            user: "user",
            type: "type",
            message: "message",
            time: "time"
        };

        // convenience functions for logging
        return {
            access: function (message) {

                var data = {
                    user: currentUser.getDisplayName(),
                    type: "access",
                    message: message,
                    time: Date.now()
                };

                return cloudData.add(model, _fieldNames, data);
            }
        }
    }])
    .factory('cloudDataPlayer', ['cloudData', 'Gamer', function (cloudData, model) {

        var _fieldNames = {
            name: "name",
            username: "email",
            password: "password"
        };

        return {
            delete: function (player) {
                return cloudData.delete(model, player);
            },

            save: function (player) {
                return cloudData.save(player);
            },

            add: function (playerData) {
                return cloudData.add(model, _fieldNames, playerData);
            },

            get: function (id) {
                return cloudData.get(model, _fieldNames, id);
            },

            getList: function (ids) {
                return cloudData.getList(model, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(model, _fieldNames);
            }

        }
    }])
    .factory('cloudDataCourse', ['cloudData', 'Course', function (cloudData, model) {

        var _fieldNames = {
            name: "name",
            tee: "tee",
            par: "par",
            yardage: "yardage",
            slope: "slope",
            rating: "rating",
            holes: "holes",
            location: "location"
        };

        return {
            delete: function (course) {
                return cloudData.delete(model, course);
            },

            save: function (course) {
                return cloudData.save(course);
            },

            add: function (courseData) {
                return cloudData.add(model, _fieldNames, courseData);
            },

            get: function (id) {
                return cloudData.get(model, _fieldNames, id);
            },

            getList: function (ids) {
                return cloudData.getList(model, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(model, _fieldNames);
            }
        }
    }])
    .factory('cloudDataEvent', ['cloudData', 'cloudDataPlayer', 'cloudDataCourse', 'Event', '$q', function (cloudData,
        cloudDataPlayer, cloudDataCourse, model, $q) {

        var _fieldNames = {
            name: "name",
            start: "start",
            end: "end",
            scoreType: "scoreType",
            provider: "provider",
            baseurl: "baseurl",
            tour: "tour",
            tournament_id: "tournament_id",
            rounds: "rounds",
            players: "players"
        };

        var getPlayers = function (localObj) {

            var deferred = $q.defer();

            // in a non-PGA round, the golfer ids and scores
            // will be contained directly in this object.  For PGA rounds
            // the scoring data is loaded separately from the official tour site
            console.log("Scoring format is : " + localObj.scoreType);

            if (localObj.scoreType == "pga-live-scoring") {
                console.log("PGA round, not loading golfer data");

                // resolve immediately since we aren't loading golfer data
                deferred.resolve(localObj);
            } else {
                console.log("non PGA round, loading golfer data");

                var players = localObj.players;
                var ids = [];

                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    ids.push(player.user);
                }

                cloudDataPlayer.getList(ids)
                    .then(function (objs) {

                            // fluff up the players object with player data
                            var playermap = {};

                            for (var i = 0; i < objs.length; i++) {
                                var obj = objs[i];
                                playermap[obj._id] = obj;
                            }

                            var validplayers = [];

                            for (var i = 0; i < players.length; i++) {
                                var player = players[i];
                                var playerdetails = playermap[player.user];

                                if (playerdetails) {
                                    player.user = playerdetails;
                                    validplayers.push(player);
                                } else {
                                    console.log("couldn't find id " + player.user);
                                    console.log("roundmap: " + JSON.stringify(playermap));
                                }
                            }

                            console.log("setting players " + JSON.stringify(validplayers));

                            localObj.players = validplayers;

                            deferred.resolve(localObj);
                        },
                        function (err) {
                            deferred.reject(err);
                        });

            }

            return deferred.promise;
        };

        var getRounds = function (localObj) {

            var deferred = $q.defer();

            var rounds = localObj.rounds;
            var ids = [];
            for (var i = 0; i < rounds.length; i++) {
                var round = rounds[i];
                ids.push(round.course);
            }

            cloudDataCourse.getList(ids)
                .then(function (objs) {

                        // fluff up the rounds object with course data
                        var roundmap = {};

                        for (var i = 0; i < objs.length; i++) {
                            var obj = objs[i];
                            roundmap[obj._id] = obj;
                        }

                        var validrounds = [];

                        for (var i = 0; i < rounds.length; i++) {
                            var round = rounds[i];
                            var coursedetails = roundmap[round.course];

                            if (coursedetails) {
                                round.course = coursedetails;
                                validrounds.push(round);
                            } else {
                                console.log("couldn't find id " + round.course);
                                console.log("roundmap: " + JSON.stringify(roundmap));
                            }
                        }

                        localObj.rounds = validrounds;

                        deferred.resolve(localObj);
                    },
                    function (err) {
                        deferred.reject(err);
                    });

            return deferred.promise;
        };

        var _removePlayers = function (localObj) {
            if (localObj && localObj.players) {

                for (var i = 0; i < localObj.players.length; i++) {
                    var player = localObj.players[i];
                    localObj.players[i].user = player.user._id;
                }

            }

        };

        var _removeRounds = function (localObj) {
            if (localObj && localObj.rounds) {

                // de-fluff the rounds and players before saving to back end
                for (var i = 0; i < localObj.rounds.length; i++) {
                    var round = localObj.rounds[i];
                    localObj.rounds[i].course = round.course._id;
                }

            }

        };

        return {
            delete: function (localObj) {
                return cloudData.delete(model, localObj);
            },

            save: function (localObj) {
                // flatten any player and round info before saving
                _removePlayers(localObj);
                _removeRounds(localObj);

                return cloudData.save(localObj);
            },

            add: function (localObj) {
                // flatten any player and round info before saving
                _removePlayers(localObj);
                _removeRounds(localObj);

                return cloudData.add(model, _fieldNames, localObj);
            },

            //
            // a get of an individual event will do a "deep" get of the
            // players and courses that are part of this event
            //
            get: function (id) {
                //                console.log("cloudDataEvent.get called for " + id);

                var deferred = $q.defer();

                cloudData.get(model, _fieldNames, id)
                    .then(function (localObj) {
                        // go kick off players and round info requests
                        var promises = [getPlayers(localObj), getRounds(localObj)];

                        return $q.all(promises);
                    })
                    .then(function (results) {
                        // all info loaded, fulfill the promise with our loaded object
                        var localObj = results[0];

                        //                        console.log("cloudDataEvent.get: fully loaded localObj " + JSON.stringify(localObj));

                        deferred.resolve(localObj);
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            getList: function (ids) {
                return cloudData.getList(model, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(model, _fieldNames);
            },

            scores: function (id) {
                // we call a custom method on the Event object (which is a remote object
                // generated by StrongLoop) that retrieves the scores for this event
                var deferred = $q.defer();

                model.scores({
                        id: id
                    },
                    function (response) {
                        console.log("cloudDataEvent.scores: Found scores!");
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

                return deferred.promise;
            }

        }
    }])
    .factory('cloudDataGame', ['cloudData', 'Game', '$q', '$resource', function (cloudData, model, $q, $resource) {

        var _fieldNames = {
            name: "name",
            start: "start",
            end: "end",
            event: "eventid",
            gamers: "gamers",
            watson: "watson"
        };

        return {
            delete: function (localObj) {
                return cloudData.delete(model, localObj);
            },

            save: function (localObj) {
                return cloudData.save(localObj);
            },

            add: function (localData) {
                return cloudData.add(model, _fieldNames, localData);
            },

            get: function (id) {
                return cloudData.get(model, _fieldNames, id);
            },

            getList: function (ids) {
                return cloudData.getList(model, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(model, _fieldNames);
            },

            savePicks: function (game, currentUser, picks) {

                // we call a custom method to save this user's picks
                var deferred = $q.defer();

                console.log("savePicks id : " + game._id +
                    ", gamerid : " + currentUser.getId() +
                    ", picks : " + JSON.stringify(picks));

                model.updateGamerPicks(
                    {
                        id: game._id,
                        gamerid: currentUser.getId()
                    },
                    picks,
                    function (response) {
                        console.log("cloudDataGame.updateGamerPicks: updated picks!");
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

// [djb 6/12/2017] I couldn't get the model generated code to work properly at first due to a bug
//                 in the usage docs for the loopback generated code.  So intially I just used
//                 Angular $resource to go directly at the REST API.  I eventually figured out the
//                 doc error and was able to use updateGamerPicks above.  I'm keeping the original
//                 code in here for reference.
//
//                var GameResource = $resource('/api/Games/:id/Gamers/:gamerid/picks', null,
//                                             { 'update': {method: 'POST'}
//                                             });
//                GameResource.update(
//                    {id: game._id, gamerid: currentUser.getId()},
//                    picks,
//                    function (response) {
//                        console.log("cloudDataGame.updateGamerPicks: updated picks!");
//                        deferred.resolve(response);
//                    },
//                    function (err) { // error
//                        deferred.reject(err);
//                    });

                return deferred.promise;
            }

        }
    }]);
