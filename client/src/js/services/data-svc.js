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
      console.log("constructor: cloudDataPlayer model: " + JSON.stringify(model));

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
                return cloudData.save(model, player);
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
    .factory('cloudDataCourse', ['cloudData', 'Course', '$q', 
    function (cloudData, model, $q) {
      console.log("constructor: cloudDataCourse model: " + JSON.stringify(model));

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
                return cloudData.save(model, course);
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
                console.log("CloudDataCourse.getAll model : ", model);
                return cloudData.getList(model, _fieldNames);
            },

            weather: function (id) {
                // we call a custom method on the Event object (which is a remote object
                // generated by StrongLoop) that retrieves the scores for this event
                var deferred = $q.defer();

                model.weather({
                        id: id
                    },
                    function (response) {
                        // console.log("cloudDataCourse.weather: Found weather!");
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

                return deferred.promise;
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

                return cloudData.save(model, localObj);
            },

            add: function (localObj) {
                // flatten any player and round info before saving
                _removePlayers(localObj);
                _removeRounds(localObj);

                return cloudData.add(model, _fieldNames, localObj);
            },

            getList: function (ids) {
                return cloudData.getList(model, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(model, _fieldNames);
            },

            scores: function (id) {
                // console.log('cloudGameData.scores');

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
            },

            deepGet: function (id) {
                // console.log('cloudEventData.withGolferScores');

                // we call a custom method on the Event object (which is a remote object
                // generated by StrongLoop) that retrieves the scores for this event
                var deferred = $q.defer();

                model.deepGet({
                        id: id
                    },
                    function (response) {
                        console.log("cloudDataEvent.withGolferScores: Found scores!");
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            newsfeed: function (id) {
                console.log('cloudEventData.newsfeed');

                // we call a custom method on the Event object (which is a remote object
                // generated by StrongLoop) that retrieves the scores for this event
                var deferred = $q.defer();

                model.newsfeed({
                        id: id
                    },
                    function (response) {
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            leaders: function (id) {
                console.log('cloudEventData.leaders');

                // we call a custom method on the Event object (which is a remote object
                // generated by StrongLoop) that retrieves the scores for this event
                var deferred = $q.defer();

                model.leaders({
                        id: id
                    },
                    function (response) {
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            weather: function (id) {
                // we call a custom method on the Event object (which is a remote object
                // generated by StrongLoop) that retrieves the scores for this event
                var deferred = $q.defer();

                model.weather({
                        id: id
                    },
                    function (response) {
                        console.log("cloudDataEvent.weather: Found weather!");
                        deferred.resolve(response);
                    },
                    function (err) { // error
                        deferred.reject(err);
                    });

                return deferred.promise;
            }

        }
    }])
    .factory('cloudDataGame', ['cloudData', 'Game', '$q', function (cloudData, model, $q) {

        // console.log('in cloudDataGame');

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
                return cloudData.save(model, localObj);
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

            leaderboard: function (id) {
                var deferred = $q.defer();

                model.leaderboard({ id: id },
                    function (result) {
                        if (result) {
                            deferred.resolve(result);
                        } else {
                            deferred.reject({
                                "err": "Couldn't get leaderboard"
                            });
                        }
                    },
                    function (err) {
                        console.error("error getting leaderboard for game :" + id + " err: " + JSON.stringify(err));

                        deferred.reject({
                            "err": err
                        });
                    });

                return deferred.promise;
            },

            withGamerDetail: function (id) {
                var deferred = $q.defer();

                model.withGamerDetail({ id: id },
                    function (result) {
                        if (result) {
                            deferred.resolve(result);
                        } else {
                            deferred.reject({
                                "err": "Couldn't get gamer detail"
                            });
                        }
                    },
                    function (err) {
                        console.error("error getting gamer detail for game :" + id + " err: " + JSON.stringify(err));

                        deferred.reject({
                            "err": err
                        });
                    });

                return deferred.promise;
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
