console.log("loading GolfPicks.cloud");

angular.module('GolfPicks.cloud', [])
    .factory('cloudData', ['$q', 'Course', 'Event', 'Game', 'Gamer', 'Log', function ($q, Course, Event, Game, Gamer, Log) {

        //
        // cloudData is a wrapper for the back end StrongLoop data API
        //
        // To insulate us from the details of the back end, this class performs actions to
        // synchronize the cloud object with a local object representation
        //
        // Each cloud object consists of a className which represents the type of the object, a unique
        // identifier named "_id" and a set of fields representing the data elements of the object
        //
        // In golfpicks, examples of valid classes are:
        //      User, Game, Event, Course
        //
        // to insulate us from the representation in the data store, we also
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

        var _models = {
            Gamer: Gamer,
            Course: Course,
            Event: Event,
            Game: Game,
            Log: Log
        };

        var _modelFromClassName = function (className) {
            return _models[className];
        };

        var _setProperties = function (cloudObj, fieldMap, objData) {

            for (var prop in fieldMap) {
                var mappedProp = fieldMap[prop];

                cloudObj.attributes[prop] = objData[mappedProp];
            }

        };

        var _newCloudObject = function (className, fieldMap, objData) {
            var cloudObj = {};
            cloudObj.attributes = {};

            _setProperties(cloudObj, fieldMap, objData);

            return cloudObj;
        };

        var _makeLocalObject = function (className, cloudObj, fieldMap) {
            var localObj = {};

            if (!fieldMap) console.error("_makeLocalObject: fieldMap is " + JSON.stringify(fieldMap));

            for (var prop in fieldMap) {
                var mappedProp = fieldMap[prop];

                localObj[mappedProp] = cloudObj.attributes[prop];
            }

            localObj._id = cloudObj.id;
            localObj._cloudObject = cloudObj;
            localObj._fieldMap = fieldMap;
            localObj._className = className;

            // console.debug("_makeLocalObject: localObj: " + JSON.stringify(localObj));

            return localObj;
        };

        return {

            delete: function (localObj) {
                console.debug("cloudData.delete: " + JSON.stringify(localObj));

                var deferred = $q.defer();
                var obj = localObj._cloudObject;
                var id = localObj._id;
                var className = localObj._className;
                var model = _modelFromClassName(className);

                if (obj) {
                    model.deleteById({
                            id: id
                        },
                        function (result) {
                            deferred.resolve(result);
                        },
                        function (err) {
                            deferred.reject(err);
                        });
                } else {
                    deferred.reject("cloudData.delete: cloudObject is " + JSON.stringify(obj));
                }

                return deferred.promise;
            },

            add: function (className, fieldNames, objData) {
                console.debug("cloudData.add: className " + className + " objData " + JSON.stringify(objData));

                var deferred = $q.defer();
                var model = _modelFromClassName(className);

                if (objData) {
                    var cloudObj = _newCloudObject(className, fieldNames, objData);

                    var obj = model.create(cloudObj,
                        function (obj) {
                            var localObj = _makeLocalObject(className, obj, fieldNames);

                            deferred.resolve(localObj);
                        },
                        function (err) {
                            deferred.reject(err);
                        });

                } else {
                    deferred.reject("cloudData.add: objData: " + JSON.stringify(objData));
                }

                return deferred.promise;
            },

            save: function (localObj) {
                console.debug("cloudData.save: " + JSON.stringify(localObj));

                var deferred = $q.defer();

                if (localObj._cloudObject && localObj._fieldMap) {

                    var cloudObj = localObj._cloudObject;
                    var fieldMap = localObj._fieldMap;

                    _setProperties(cloudObj, fieldMap, localObj);

                    cloudObj.$save(
                        function (obj) {
                            // return the saved object back
                            deferred.resolve(localObj);
                        },
                        function (err) {
                            deferred.reject(err);
                        }
                    );
                } else {
                    deferred.reject("cloudData.save: _cloudObject is " + localObj._cloudObject +
                        " and _fieldMap is " + localObj._fieldMap);
                }

                return deferred.promise;
            },

            get: function (className, fieldNames, id) {
                console.debug("cloudData.get: className " + className + " id " + id);

                var deferred = $q.defer();
                var model = _modelFromClassName(className);

                model.findById({
                        id: id
                    },
                    function (obj) {
                        console.log("found object!");

                        var localObj = _makeLocalObject(className, obj, fieldNames);

                        deferred.resolve(localObj);
                    },
                    function (err) {
                        console.error("cloudData.get error :" + JSON.stringify(err));
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            getList: function (className, fieldNames, ids) {
                console.debug("cloudData.getList: className: " + className + ", ids: " + JSON.stringify(ids));

                var deferred = $q.defer();
                var model = _modelFromClassName(className);

                // if a list of ids is given, then filter based on that
                var filter = "";

                if (ids) {
                    filter = {
                        filter: {
                            where: {
                                id: {
                                    inq: ids
                                }
                            }
                        }
                    };
                }

                model.find(filter,
                    function (objects) {

                        console.log("found objects!");
                        var localObjs = [];
                        var i;

                        for (i = 0; i < objects.length; i++) {
                            var obj = objects[i];
                            var localObj = _makeLocalObject(className, obj, fieldNames);

                            localObjs.push(localObj);
                        }

                        deferred.resolve(localObjs);
                    },
                    function (err) {
                        console.error("cloudData.getList error :" + JSON.stringify(err));
                        deferred.reject(err);
                    });

                return deferred.promise;
            }
        };

    }])
    .factory('cloudDataCurrentUser', ['$q', 'Gamer', function ($q, Gamer) {

        var _cookieName = "golfpicks";
        var _currentUser = null;

        var _getCurrentUser = function () {

            if (!_currentUser) {
                // look at the cookies to fluff up our user object if it exists
                var cookie = _getCookie(_cookieName);

                if (cookie && cookie.length > 0) {
                    _setCurrentUser(_deserialize(cookie));
                }
            }

            return _currentUser;
        };


        var _setCurrentUser = function (value) {
            _currentUser = value;
        };

        var _serialize = function (obj) {
            return JSON.stringify(obj);
        };

        var _deserialize = function (str) {
            var obj = JSON.parse(str);

            return obj;
        };

        var _getCookie = function (name) {
            var val = document.cookie;
            var start = val.indexOf(" " + name + "=");

            if (start == -1) {
                start = val.indexOf(name + "=");
            }

            if (start == -1) {
                val = null;
            } else {
                start = val.indexOf("=", start) + 1;

                var end = val.indexOf(";", start);

                if (end == -1) {
                    end = val.length;
                }

                val = unescape(val.substring(start, end));
            }

            return val;
        };

        var _setCookie = function (name, value, daysValid) {
            var expires = new Date();

            expires.setDate(expires.getDate() + daysValid);

            var escapedValue = escape(value) +
                ((expires == null) ? "" : "; expires=" + expires.toUTCString());

            document.cookie = name + "=" + escapedValue;
        };


        // convenience functions for logging in, out current user
        return {
            isLoggedIn: function () {
                return (_getCurrentUser()) ? true : false;
            },

            logIn: function (user, pass) {
                var deferred = $q.defer();

                Gamer.login({user:user, password:pass},
                    function (result) {
                        if (result) {
                            var gamer = result;

                            // save our result as a cookie so we stay logged in across pages/reloads
                            _setCookie(_cookieName, _serialize(gamer), 7);
                            _setCurrentUser(gamer);

                            deferred.resolve(user);
                        } else {
                            deferred.reject({
                                "user": user,
                                "err": "Couldn't find user"
                            });
                        }
                    },
                    function (err) {
                        console.error("error logging in user :" + user + " err: " + JSON.stringify(err));

                        deferred.reject({
                            "user": user,
                            "err": err
                        });
                    });

                return deferred.promise;
            },

            logOut: function () {
                if (this.isLoggedIn()) {
                    // unset the cookie to show we're logged out
                    _setCookie(_cookieName, "");

                    _setCurrentUser(undefined);
                } else {
                    console.error("logOut error: Not logged in.");
                }
            },

            getDisplayName: function () {
                var current = _getCurrentUser();

                if (current && current.attributes) {
                    return current.attributes.name;
                }
                return null;
            },

            isAdmin: function () {
                var current = _getCurrentUser();

                if (current && current.attributes) {
                    if (current.attributes.admin) {
                        return true;
                    }
                }

                return false;
            },

            getId: function () {
                var current = _getCurrentUser();

                return current.id;
            },

            isEqualTo: function (obj) {
                return this.getId() == obj._id;
            }
        };
    }]);
