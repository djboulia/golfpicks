console.log("loading GolfPicks.cloud");

angular.module('GolfPicks.cloud', [])
    .factory('cloudData', ['$q', '$http', function ($q, $http) {

        //
        // cloudData is a wrapper for the back end StrongLoop data API
        //
        // To insulate us from the details of the back end, this class performs actions to
        // synchronize the cloud object with a local object representation
        //
        // Each cloud object is backed by a StrongLoop model which represents the type of the object
        // Data returned from the model consists of a unique identifier named "_id"
        // and a set of fields representing the data elements of the object
        //
        // In golfpicks, examples of valid models are:
        //      Gamer, Game, Event, Course
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

        var _setProperties = function (cloudObj, fieldMap, objData) {

            for (var prop in fieldMap) {
                var mappedProp = fieldMap[prop];

                cloudObj.attributes[prop] = objData[mappedProp];
            }

        };

        var _newCloudObject = function (fieldMap, objData) {
            var cloudObj = {};
            cloudObj.attributes = {};

            _setProperties(cloudObj, fieldMap, objData);

            return cloudObj;
        };

        var _makeLocalObject = function (cloudObj, fieldMap) {
            var localObj = {};

            if (!fieldMap) console.error("_makeLocalObject: fieldMap is " + JSON.stringify(fieldMap));

            for (var prop in fieldMap) {
                var mappedProp = fieldMap[prop];

                localObj[mappedProp] = cloudObj.attributes[prop];
            }

            localObj._id = cloudObj.id;
            localObj._cloudObject = cloudObj;
            localObj._fieldMap = fieldMap;

            // console.debug("_makeLocalObject: localObj: " + JSON.stringify(localObj));

            return localObj;
        };

        return {

            delete: function (model, localObj) {
                // console.debug("cloudData.delete: " + JSON.stringify(localObj));

                var deferred = $q.defer();
                var obj = localObj._cloudObject;
                var id = localObj._id;

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

            add: function (model, fieldNames, objData) {
                // console.debug("cloudData.add: objData " + JSON.stringify(objData));

                var deferred = $q.defer();

                if (objData) {
                    var cloudObj = _newCloudObject(fieldNames, objData);

                    model.create(cloudObj,
                        function (obj) {
                            var localObj = _makeLocalObject(obj, fieldNames);

                            deferred.resolve(localObj);
                        },
                        function (err) {
                            deferred.reject(err);
                        });

                } else {
                    deferred.reject("error cloudData.add: objData: " + JSON.stringify(objData));
                }

                return deferred.promise;
            },

            save: function (model, localObj) {
                console.debug("cloudData.save: " + JSON.stringify(localObj));

                var deferred = $q.defer();

                if (localObj._cloudObject && localObj._fieldMap) {

                    var cloudObj = localObj._cloudObject;
                    var fieldMap = localObj._fieldMap;

                    _setProperties(cloudObj, fieldMap, localObj);

                    model.put(cloudObj,
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

            get: function (model, fieldNames, id) {
                console.debug("cloudData.get: id " + id);

                var deferred = $q.defer();

                model.findById({
                    id: id
                },
                    function (obj) {
                        // console.log("found object!");

                        var localObj = _makeLocalObject(obj, fieldNames);

                        deferred.resolve(localObj);
                    },
                    function (err) {
                        console.error("cloudData.get error :" + JSON.stringify(err));
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            getList: function (model, fieldNames, ids) {
                // console.debug("model: ", model);
                console.debug("cloudData.getList: ids: " + JSON.stringify(ids));

                var deferred = $q.defer();

                // // if a list of ids is given, then filter based on that
                // var filter = "";

                // if (ids) {
                //     filter = {
                //         filter: {
                //             where: {
                //                 id: {
                //                     inq: ids
                //                 }
                //             }
                //         }
                //     };
                // }
                if (ids) {
                    model.findByIds(ids,
                        function (objects) {

                            // console.log("found objects! " + JSON.stringify(objects));
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
                            console.error("cloudData.getList error :" + JSON.stringify(err));
                            deferred.reject(err);
                        });
                } else {
                    model.findAll(
                        function (objects) {

                            // console.log("found objects! " + JSON.stringify(objects));
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
                            console.error("cloudData.getList error :" + JSON.stringify(err));
                            deferred.reject(err);
                        });
                }

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

                Gamer.login({ user: user, password: pass },
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
