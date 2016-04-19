console.log("loading GolfPicks.cloud");

angular.module('GolfPicks.cloud', [])
    .factory('cloudData', ['$q', function ($q) {
        return {

            create: function (className, obj) {
                return CloudObjects.Object.create(className, obj);
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
            access: function (message, callbacks) {
                CloudObjects.Log.write(currentUser.getDisplayName(), "access", message, callbacks);
            }
        }
    }])
    .factory('cloudDataPlayer', ['cloudData', function (cloudData) {

        var _className = "User";

        var _assignPlayer = function (obj) {
            var player = {};

            player._id = obj.getObjectId();
            player.name = obj.get("name");
            player.email = obj.get("username");
            player.password = obj.get("password");
            player._cloudObject = obj;

            return player;
        };

        return {
            delete: function (player, callbacks) {
                if (player._cloudObject) {

                    player._cloudObject.delete({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(obj);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) {
                                callbacks.error(err);
                            }
                        }
                    });
                }
            },

            save: function (player, callbacks) {
                if (player._cloudObject) {

                    player._cloudObject.set("name", player.name);
                    player._cloudObject.set("username", player.email);
                    player._cloudObject.set("password", player.password);

                    player._cloudObject.save({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(player);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) {
                                callbacks.error(err);
                            }
                        }
                    });
                }
            },

            add: function (player, callbacks) {
                if (player) {
                    var attrs = {
                        name: player.name,
                        username: player.email,
                        password: player.password
                    };

                    player = cloudData.create(_className, attrs);

                    player.save({
                        success: function (obj) {
                            // return the saved object back 
                            attrs._id = obj.getObjectId();
                            attrs._cloudObject = obj;

                            if (callbacks && callbacks.success) {
                                callbacks.success(attrs);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) {
                                callbacks.error(err);
                            }
                        }
                    });
                }
            },

            get: function (id, callbacks) {
                var thisObj = this;

                cloudData.getObject(_className, id)
                    .then(function (obj) {
                            console.log("found object!");

                            var player = _assignPlayer(obj);

                            if (callbacks && callbacks.success) {
                                callbacks.success(player);
                            }
                        },
                        function (err) {
                            if (callbacks && callbacks.error) {
                                callbacks.error(err);
                            }
                        });
            },

            getList: function (ids, callbacks) {
                var thisObj = this;

                cloudData.getObjects(_className, ids)
                    .then(function (objects) {

                            console.log("found objects!");
                            var players = [];
                            var i;

                            for (i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var player = _assignPlayer(obj);

                                players.push(player);
                            }

                            if (callbacks && callbacks.success) callbacks.success(players);
                        },

                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },

            getAll: function (callbacks) {
                var thisObj = this;

                cloudData.getObjects(_className)
                    .then(function (objects) {

                            console.log("found objects!");
                            var players = [];
                            var i;

                            for (i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var player = _assignPlayer(obj);

                                players.push(player);
                            }

                            if (callbacks && callbacks.success) callbacks.success(players);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            }

        }
    }])
    .factory('cloudDataCourse', ['cloudData', function (cloudData) {

        var _className = "Course";

        var _getObjectData = function (obj) {
            var course = {};

            course._id = obj.getObjectId();
            course._cloudObject = obj;

            course.name = obj.get("name");
            course.tee = obj.get("tee");
            course.par = obj.get("par");
            course.yardage = obj.get("yardage");
            course.slope = obj.get("slope");
            course.rating = obj.get("rating");
            course.holes = obj.get("holes");
            course.location = obj.get("location");

            return course;
        };

        var _setObjectData = function (cloudObject, course) {
            cloudObject.set("name", course.name);
            cloudObject.set("tee", course.tee);
            cloudObject.set("par", course.par);
            cloudObject.set("yardage", course.yardage);
            cloudObject.set("slope", course.slope);
            cloudObject.set("rating", course.rating);
            cloudObject.set("holes", course.holes);
            cloudObject.set("location", course.location);
        };

        return {
            delete: function (course, callbacks) {
                if (course._cloudObject) {

                    course._cloudObject.delete({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(obj);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            save: function (course, callbacks) {
                if (course._cloudObject) {
                    var cloudObject = course._cloudObject;

                    _setObjectData(cloudObject, course);

                    cloudObject.save({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(course);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            add: function (course, callbacks) {
                if (course) {
                    var cloudObject = cloudData.create(_className);

                    _setObjectData(cloudObject, course);

                    cloudObject.save({
                        success: function (obj) {
                            // return the saved object back 
                            var saved = _getObjectData(obj);

                            if (callbacks && callbacks.success) {
                                callbacks.success(saved);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            get: function (id, callbacks) {

                cloudData.getObject(_className, id)
                    .then(function (obj) {
                            console.log("found course!");

                            var course = _getObjectData(obj);

                            if (callbacks && callbacks.success) callbacks.success(course);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },

            getList: function (ids, callbacks) {
                var thisObj = this;

                cloudData.getObjects(_className, ids)
                    .then(function (objects) {

                            console.log("found objects!");
                            var localObjs = [];

                            for (var i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var localObj = _getObjectData(obj);

                                localObjs.push(localObj);
                            }

                            if (callbacks && callbacks.success) callbacks.success(localObjs);
                        },

                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },

            getAll: function (callbacks) {

                cloudData.getObjects(_className)
                    .then(function (objects) {

                            var courses = [];

                            for (var i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var course = _getObjectData(obj);

                                courses.push(course);
                            }

                            if (callbacks && callbacks.success) callbacks.success(courses);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            }
        }
    }])
    .factory('cloudDataEvent', ['cloudData', 'cloudDataPlayer', 'cloudDataCourse', function (cloudData, cloudDataPlayer, cloudDataCourse) {

        var _className = "Event";

        var _getObjectData = function (obj) {
            var localObj = {};

            localObj._id = obj.getObjectId();
            localObj._cloudObject = obj;

            localObj.name = obj.get("name");
            localObj.start = obj.get("start");
            localObj.end = obj.get("end");
            localObj.scoreType = obj.get("scoreType");
            localObj.rounds = obj.get("rounds");
            localObj.players = obj.get("players");

            return localObj;
        };

        var _setObjectData = function (cloudObject, localObj) {
            cloudObject.set("name", localObj.name);
            cloudObject.set("start", localObj.start);
            cloudObject.set("end", localObj.end);
            cloudObject.set("scoreType", localObj.scoreType);
            cloudObject.set("rounds", localObj.rounds);
            cloudObject.set("players", localObj.players);
        };

        var callChain = 0;

        var handleSuccessCallback = function (localObj, callbacks) {
            callChain--;
            if (callChain == 0) {
                if (callbacks && callbacks.success) callbacks.success(localObj);
            }
        };

        var handleErrorCallback = function (err, callbacks) {
            if (callChain >= 0) {
                callChain = -1;

                console.log("error getting event: " + err);

                if (callbacks && callbacks.error) callbacks.error(err);
            }
        };

        var getPlayers = function (localObj, callbacks) {

            callChain++;

            var players = localObj.players;
            var ids = [];

            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                ids.push(player.user);
            }

            cloudDataPlayer.getList(ids, {
                success: function (objs) {

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

                    handleSuccessCallback(localObj, callbacks);
                },
                error: function (err) {

                    handleErrorCallback(err, callbacks);
                }
            });
        }

        var getRounds = function (localObj, callbacks) {

            callChain++;

            var rounds = localObj.rounds;
            var ids = [];
            for (var i = 0; i < rounds.length; i++) {
                var round = rounds[i];
                ids.push(round.course);
            }

            cloudDataCourse.getList(ids, {
                success: function (objs) {

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

                    handleSuccessCallback(localObj, callbacks);
                },
                error: function (err) {
                    handleErrorCallback(err, callbacks);
                }
            });
        }

        return {
            delete: function (localObj, callbacks) {
                if (localObj._cloudObject) {

                    localObj._cloudObject.delete({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(obj);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            save: function (localObj, callbacks) {
                if (localObj._cloudObject) {

                    // de-fluff the rounds and players before saving to back end
                    for (var i = 0; i < localObj.rounds.length; i++) {
                        var round = localObj.rounds[i];
                        localObj.rounds[i].course = round.course._id;
                    }

                    for (var i = 0; i < localObj.players.length; i++) {
                        var player = localObj.players[i];
                        localObj.players[i].user = player.user._id;
                    }

                    var cloudObject = localObj._cloudObject;

                    _setObjectData(cloudObject, localObj);

                    cloudObject.save({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(localObj);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            add: function (localObj, callbacks) {
                if (localObj) {
                    var cloudObject = cloudData.create(_className);

                    _setObjectData(cloudObject, localObj);

                    cloudObject.save({
                        success: function (obj) {
                            // return the saved object back 
                            var saved = _getObjectData(obj);

                            if (callbacks && callbacks.success) {
                                callbacks.success(saved);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            //
            // a get of an individual event will do a "deep" get of the
            // players and courses that are part of this event
            //
            get: function (id, callbacks) {

                cloudData.getObject(_className, id)
                    .then(function (obj) {
                            console.log("found course!");

                            var localObj = _getObjectData(obj);

                            // in a non-PGA round, the golfer ids and scores
                            // will be contained directly in this object.  For PGA rounds
                            // the scoring data is loaded separately from the official tour site
                            console.log("Scoring format is : " + localObj.scoreType);

                            if (localObj.scoreType != "pga-live-scoring") {
                                console.log("non PGA round, loading golfer data");
                                getPlayers(localObj, callbacks);
                            } else {
                                console.log("PGA round, not loading golfer data");
                            }

                            getRounds(localObj, callbacks);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },

            getAll: function (callbacks) {

                cloudData.getObjects(_className)
                    .then(function (objects) {

                            var localObjs = [];

                            for (var i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var localObj = _getObjectData(obj);

                                localObjs.push(localObj);
                            }

                            if (callbacks && callbacks.success) callbacks.success(localObjs);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },

        }
    }])
    .factory('cloudDataGame', ['cloudData', function (cloudData) {

        var _className = "Game";

        var _getObjectData = function (obj) {
            var localObj = {};

            localObj._id = obj.getObjectId();
            localObj._cloudObject = obj;

            localObj.name = obj.get("name");
            localObj.start = obj.get("start");
            localObj.end = obj.get("end");
            localObj.eventid = obj.get("event");
            localObj.gamers = obj.get("gamers");

            return localObj;
        };

        var _setObjectData = function (cloudObject, localObj) {
            cloudObject.set("name", localObj.name);
            cloudObject.set("start", localObj.start);
            cloudObject.set("end", localObj.end);
            cloudObject.set("event", localObj.eventid);
            cloudObject.set("gamers", localObj.gamers);
        };

        return {
            save: function (localObj, callbacks) {
                if (localObj._cloudObject) {
                    var cloudObject = localObj._cloudObject;

                    _setObjectData(cloudObject, localObj);

                    cloudObject.save({
                        success: function (obj) {
                            // return the saved object back 

                            if (callbacks && callbacks.success) {
                                callbacks.success(localObj);
                            }
                        },
                        error: function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        }
                    });
                }
            },

            get: function (id, callbacks) {

                cloudData.getObject(_className, id)
                    .then(function (obj) {
                            console.log("found " + _className + " with id " + id);

                            var localObj = _getObjectData(obj);

                            if (callbacks && callbacks.success) callbacks.success(localObj);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },


            getAll: function (callbacks) {

                cloudData.getObjects(_className)
                    .then(function (objects) {

                            var courses = [];

                            for (var i = 0; i < objects.length; i++) {
                                var obj = objects[i];
                                var course = _getObjectData(obj);

                                courses.push(course);
                            }

                            if (callbacks && callbacks.success) callbacks.success(courses);
                        },
                        function (err) {
                            if (callbacks && callbacks.error) callbacks.error(err);
                        });
            },

            savePicks: function (game, currentUser, picks, callbacks) {

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

                this.save(game, callbacks);
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
