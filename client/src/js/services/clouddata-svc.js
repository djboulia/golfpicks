console.log("loading GolfPicks.cloud");

angular.module('GolfPicks.cloud', [])
    .factory('cloudData', ['$q', function ($q) {

        //
        // cloudData is a wrapper for the underlying (non Angular) cloud-objects library
        //
        // To insulate us from the details of that library, this class performs actions to
        // synchronize the cloud object with a local object representation
        //
        // Each cloud object consists of a className which represents the type of the object, a unique
        // identifier named "_id" and a set of fields representing the data elements of the object
        //
        // In golfpicks, examples of valid classes are:
        //      User, Game, Event, Course
        //
        // to insulate us from the representation in the cloud-objects library, we also
        // define a list of field names which are the ONLY things that will be synced
        // with the back end.  the field names is an object where the keys are the name
        // in the cloud-object, and the values represent the name that will be used in the
        // local object.
        //
        // So, for instance, if you wanted to map the "username" field in
        // the cloud object to a field named "email" in the local object, it would look like this:
        //
        // var fieldNames = {
        //      username : "email"
        // }
        //
        // this will cause the cloudData factory to synchronize one field (username) from the
        // cloud with the local object where the field is named "email".  This means that
        // any other fields contained in the original cloud object would be invisible to the
        // local object.  And conversely, any local fields added to the local would be ignored
        // when updating the back end cloud object.
        //

        var _setProperties = function (cloudObj, fieldMap, objData) {

            for (var prop in fieldMap) {
                var mappedProp = fieldMap[prop];

                cloudObj.set(prop, objData[mappedProp]);
            }

        };

        var _makeLocalObject = function (cloudObj, fieldMap) {
            var localObj = {};

            if (!fieldMap) console.error("_makeLocalObject: fieldMap is " + JSON.stringify(fieldMap));

            for (var prop in fieldMap) {
                var mappedProp = fieldMap[prop];

                localObj[mappedProp] = cloudObj.get(prop);
            }

            localObj._id = cloudObj.getObjectId();
            localObj._cloudObject = cloudObj;
            localObj._fieldMap = fieldMap;

            console.debug("_makeLocalObject: localObj: " + JSON.stringify(localObj));

            return localObj;
        };

        return {

            delete: function (localObj) {
                var deferred = $q.defer();
                var obj = localObj._cloudObject;

                if (obj) {
                    obj.delete({
                        success: function (result) {
                            deferred.resolve(result);
                        },
                        error: function (err) {
                            deferred.reject(err);
                        }
                    });
                } else {
                    deferred.reject("cloudData.delete: cloudObject is " + JSON.stringify(obj));
                }

                return deferred.promise;
            },

            add: function (className, fieldNames, objData) {
                var deferred = $q.defer();

                if (objData) {
                    var cloudObj = CloudObjects.Object.create(className);

                    _setProperties(cloudObj, fieldNames, objData);

                    cloudObj.save({
                        success: function (obj) {

                            var localObj = _makeLocalObject(obj, fieldNames);

                            deferred.resolve(localObj);

                        },
                        error: function (err) {
                            deferred.reject(err);
                        }
                    });
                } else {
                    deferred.reject("cloudData.add: objData: " + JSON.stringify(objData));
                }

                return deferred.promise;
            },

            save: function (localObj) {
                var deferred = $q.defer();

                if (localObj._cloudObject && localObj._fieldMap) {

                    var cloudObj = localObj._cloudObject;
                    var fieldMap = localObj._fieldMap;

                    _setProperties(cloudObj, fieldMap, localObj);

                    localObj._cloudObject.save({
                        success: function (obj) {
                            // return the saved object back
                            deferred.resolve(localObj);
                        },
                        error: function (err) {
                            deferred.reject(err);
                        }
                    });
                } else {
                    deferred.reject("cloudData.save: _cloudObject is " + localObj._cloudObject +
                        " and _fieldMap is " + localObj._fieldMap);
                }

                return deferred.promise;
            },

            getObject: function (className, id) {

                var deferred = $q.defer();
                var query = CloudObjects.Query.create(className);

                query.isEqualTo("_id", id);

                query.find({
                    success: function (result) {
                        // result should be a single member, validate that
                        if (result && result.length == 1) {
                            var object = result[0];

                            deferred.resolve(object);
                        } else {
                            //                            console.error("query.find for id " + id + ": " + JSON.stringify(result));
                            var msg = "Couldn't find object with _id " + id + "!";

                            deferred.reject(msg);
                        }
                    },
                    error: function (err) {
                        console.error("error :" + err);
                        deferred.reject(err);
                    }
                });

                return deferred.promise;
            },

            get: function (className, fieldNames, id) {
                var deferred = $q.defer();

                this.getObject(className, id)
                    .then(function (obj) {
                            console.log("found object!");

                            var localObj = _makeLocalObject(obj, fieldNames);

                            deferred.resolve(localObj);
                        },
                        function (err) {
                            deferred.reject(err);
                        });

                return deferred.promise;
            },

            getObjects: function (className, ids) {

                var deferred = $q.defer();
                var query = CloudObjects.Query.create(className);

                // if a list of ids is given, then filter based on that
                if (ids) {
                    query.containedIn("_id", ids);
                }

                query.find({
                    success: function (result) {
                        deferred.resolve(result);
                    },
                    error: function (err) {
                        console.error("error :" + JSON.stringify(err));
                        deferred.reject(err);
                    }
                });

                return deferred.promise;
            },

            getList: function (className, fieldNames, ids) {
                var deferred = $q.defer();

                this.getObjects(className, ids)
                    .then(function (objects) {

                            console.log("found objects!");
                            var localObjs = [];
                            var i;

                            for (i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var localObj = _makeLocalObject(obj, fieldNames);

                                localObjs.push(localObj);
                            }

                            deferred.resolve(localObjs);
                        },

                        function (err) {
                            deferred.reject(err);
                        });

                return deferred.promise;
            }
        };

   }])
    .factory('cloudDataCurrentUser', ['$q', function ($q) {
        // convenience functions for logging in, out current user
        return {
            isLoggedIn: function () {
                var user = CloudObjects.User;

                return (user.current()) ? true : false;
            },

            logIn: function (user, pass, callbacks) {
                var deferred = $q.defer();

                CloudObjects.User.logIn(user, pass, {
                    success: function (result) {
                        deferred.resolve(result);
                    },
                    error: function (user, err) {
                        console.error("error logging in user :" + user + " err: " + JSON.stringify(err));

                        deferred.reject({
                            "user": user,
                            "err": err
                        });
                    }
                });

                return deferred.promise;
            },

            logOut: function () {
                CloudObjects.User.logOut();
            },

            getDisplayName: function () {
                var current = CloudObjects.User.current();

                if (current) {
                    return current.get("name");
                }
            },

            isAdmin: function () {
                var current = CloudObjects.User.current();

                if (current) {
                    if (current.get("admin")) {
                        return true;
                    }
                }

                return false;
            },

            getId: function () {
                var current = CloudObjects.User.current();

                return current.getObjectId();
            },

            isEqualTo: function (obj) {
                return this.getId() == obj._id;
            }
        };
    }])
    .factory('cloudDataLog', ['cloudDataCurrentUser', function (currentUser) {
        // convenience functions for logging
        return {
            access: function (message) {
                CloudObjects.Log.write(currentUser.getDisplayName(), "access", message, null);
            }
        }
    }])
    .factory('cloudDataPlayer', ['cloudData', function (cloudData) {

        var _className = "User";
        var _fieldNames = {
            name: "name",
            username: "email",
            password: "password"
        };

        return {
            delete: function (player) {
                return cloudData.delete(player);
            },

            save: function (player) {
                return cloudData.save(player);
            },

            add: function (playerData) {
                return cloudData.add(_className, _fieldNames, playerData);
            },

            get: function (id) {
                return cloudData.get(_className, _fieldNames, id);
            },

            getList: function (ids) {
                return cloudData.getList(_className, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(_className, _fieldNames);
            }

        }
    }])
    .factory('cloudDataCourse', ['cloudData', function (cloudData) {

        var _className = "Course";
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
                return cloudData.delete(course);
            },

            save: function (course) {
                return cloudData.save(course);
            },

            add: function (courseData) {
                return cloudData.add(_className, _fieldNames, courseData);
            },

            get: function (id) {
                return cloudData.get(_className, _fieldNames, id);
            },

            getList: function (ids) {
                return cloudData.getList(_className, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(_className, _fieldNames);
            }
        }
    }])
    .factory('cloudDataEvent', ['cloudData', 'cloudDataPlayer', 'cloudDataCourse', '$q', function (cloudData,
        cloudDataPlayer, cloudDataCourse, $q) {

        var _className = "Event";
        var _fieldNames = {
            name: "name",
            start: "start",
            end: "end",
            scoreType: "scoreType",
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
                return cloudData.delete(localObj);
            },

            save: function (localObj) {
                _removePlayers(localObj);
                _removeRounds(localObj);

                return cloudData.save(localObj);
            },

            add: function (localObj) {
                _removePlayers(localObj);
                _removeRounds(localObj);

                return cloudData.add(_className, _fieldNames, localObj);
            },

            //
            // a get of an individual event will do a "deep" get of the
            // players and courses that are part of this event
            //
            get: function (id) {
                console.log("cloudDataEvent.get called for " + id);

                var deferred = $q.defer();

                cloudData.get(_className, _fieldNames, id)
                    .then(function (localObj) {
                        // go kick off players and round info requests
                        var promises = [getPlayers(localObj), getRounds(localObj)];

                        return $q.all(promises);
                    })
                    .then(function (results) {
                        // all info loaded, fulfill the promise with our loaded object
                        var localObj = results[0];

                        console.log("cloudDataEvent.get: fully loaded localObj " + JSON.stringify(localObj));

                        deferred.resolve(localObj);
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            getList: function (ids) {
                return cloudData.getList(_className, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(_className, _fieldNames);
            }

        }
    }])
    .factory('cloudDataGame', ['cloudData', function (cloudData) {

        var _className = "Game";
        var _fieldNames = {
            name: "name",
            start: "start",
            end: "end",
            event: "eventid",
            gamers: "gamers"
        };

        return {
            delete: function (localObj) {
                return cloudData.delete(localObj);
            },

            save: function (localObj) {
                return cloudData.save(localObj);
            },

            add: function (localData) {
                return cloudData.add(_className, _fieldNames, localData);
            },

            get: function (id) {
                return cloudData.get(_className, _fieldNames, id);
            },

            getList: function (ids) {
                return cloudData.getList(_className, _fieldNames, ids);
            },

            getAll: function () {
                return cloudData.getList(_className, _fieldNames);
            },

            savePicks: function (game, currentUser, picks) {

                var found = false;
                var gamers = game.gamers;

                if (!gamers) {
                    gamers = [];
                }

                for (var i = 0; i < gamers.length; i++) {
                    if (gamers[i].user == currentUser.getId()) {
                        //			alert("matched user " +  JSON.stringify(currentUser["objectId"]) + "with :" + JSON.stringify(players[i].user["objectId"]) );
                        gamers[i].picks = picks;
                        found = true;
                    }
                }

                if (!found) {
                    // no saved info for this player... add it
                    gamers.push({
                        "user": currentUser.getId(),
                        "picks": picks
                    });
                }

                game.gamers = gamers;

                console.debug("Submitting the following picks: " +
                    JSON.stringify(picks));

                return this.save(game);
            }

        }
    }])
    .factory('cloudDataScores', ['$http', function ($http) {

        return {
            get: function (id, callbacks) {

                $http.get("/data/scores/" + id)
                    .then(
                        function (response) {
                            if (callbacks && callbacks.success) callbacks.success(response.data);
                        },
                        function (response) { // error
                            if (callbacks && callbacks.error) callbacks.error(response);
                        });
            }
        };
    }])
    .run(['cloudData', function (data) {
        var appId = "f8d032f7-3aef-437f-ace5-5febedad2ed7-bluemix";
        console.log('initializing cloudData with appId: ' + appId);

        // setup our backend data store
        CloudObjects.init({
            applicationId: appId,
            defaultEndpoint: ""
        });

    }]);
