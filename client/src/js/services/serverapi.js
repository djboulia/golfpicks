console.log("loading GolfPicks.serverApi");

angular.module('GolfPicks.serverApi', [])
    .factory('Model', ['$q', '$http', function ($q, $http) {

        return {
            create: function (path, obj, success, err) {
                // console.debug("Model.create: " + JSON.stringify(obj));

                $http.post(path, obj.attributes).then(
                    function successCallback(response) {
                        // console.log("Successfully created object ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("create of data failed");
                        err(response);
                    }
                );
            },
            findById: function (path, params, success, err) {
                // console.debug("Model.findbyId: ", params);

                var id = params.id;
                var idPath = path + '/' + id;

                $http.get(idPath).then(
                    function successCallback(response) {
                        // console.log("Successfully found data ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("find of data failed");
                        err(response);
                    }
                );
            },
            findAll: function (path, success, err) {
                // console.debug("Model.findAll");

                $http.get(path).then(
                    function successCallback(response) {
                        // console.log("Successfully foundAll data ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("find of findAll failed");
                        err(response);
                    }
                );
            },
            findByIds: function (path, ids, success, err) {
                // console.debug("Model.findids: " + ids);

                var idPath = path + '/findByIds';

                $http.post(idPath, ids).then(
                    function successCallback(response) {
                        // console.log("Successfully found ids", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("find of ids failed");
                        err(response);
                    }
                );
            },
            put: function (path, obj, success, err) {
                console.debug("Model.put: ", obj);

                $http.put(path, obj).then(
                    function successCallback(response) {
                        console.log("Successfully put ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("put failed");
                        err(response);
                    }
                );
            },
            deleteById: function (path, params, success, err) {
                console.debug("Model.deleteById: ", params);

                var id = params.id;
                var idPath = path + '/' + id;

                $http.get(idPath).then(
                    function successCallback(response) {
                        console.log("Successfully deleted data ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("Deleting of data failed");
                        err(response);
                    }
                );
            }

        }
    }])
    .factory('Log', ['Model', function (model) {
        var path = '/api/Logs';

        return {
            create: function (obj, success, err) {
                return model.create(path, obj, success, err);
            },
            findById: function (id, success, err) {
                return model.findById(path, id, success, err);
            },
            findAll: function (success, err) {
                return model.findAll(path, success, err);
            },
            findByIds: function (ids, success, err) {
                return model.findByIds(path, ids, success, err);
            },
            put: function (obj, success, err) {
                return model.put(path, obj, success, err);
            },
            deleteById: function (id, success, err) {
                return model.deleteById(path, id, success, err);
            }
        }
    }])
    .factory('Game', ['$http', 'Model', function ($http, model) {
        var path = '/api/Games';

        return {
            create: function (obj, success, err) {
                return model.create(path, obj, success, err);
            },
            findById: function (id, success, err) {
                return model.findById(path, id, success, err);
            },
            findAll: function (success, err) {
                return model.findAll(path, success, err);
            },
            findByIds: function (ids, success, err) {
                return model.findByIds(path, ids, success, err);
            },
            put: function (obj, success, err) {
                return model.put(path, obj, success, err);
            },
            deleteById: function (id, success, err) {
                return model.deleteById(path, id, success, err);
            },

            updateGamerPicks: function (obj, picks, success, err) {
                console.debug("Game.updateGamerPicks: " + JSON.stringify(obj));

                var id = obj.id;
                var gamerid = obj.gamerid;
                var picksPath = path + '/' + id + '/Gamers/' + gamerid + '/picks';

                $http.post(picksPath, picks).then(
                    function successCallback(response) {
                        console.log("Successfully updated picks ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("picks update failed");
                        err(response);
                    }
                );
            },
        }
    }])
    .factory('Event', ['$http', 'Model', function ($http, model) {
        var path = '/api/Events';

        return {
            create: function (obj, success, err) {
                return model.create(path, obj, success, err);
            },
            findById: function (id, success, err) {
                return model.findById(path, id, success, err);
            },
            findAll: function (success, err) {
                return model.findAll(path, success, err);
            },
            findByIds: function (ids, success, err) {
                return model.findByIds(path, ids, success, err);
            },
            put: function (obj, success, err) {
                return model.put(path, obj, success, err);
            },
            deleteById: function (id, success, err) {
                return model.deleteById(path, id, success, err);
            },

            scores: function (obj, success, err) {
                console.debug("Event.scores: " + JSON.stringify(obj));

                var id = obj.id;
                var scoresPath = path + '/' + id + '/scores';

                $http.get(scoresPath).then(
                    function successCallback(response) {
                        console.log("Successfully got scores ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("scores failed");
                        err(response);
                    }
                );
            },

            weather: function (obj, success, err) {
                console.debug("Event.weather: " + JSON.stringify(obj));

                var id = obj.id;
                var weatherPath = path + '/' + id + '/weather';

                $http.get(weatherPath).then(
                    function successCallback(response) {
                        console.log("Successfully got weather ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("weather failed");
                        err(response);
                    }
                );
            }
        }
    }])
    .factory('Course', ['$http', 'Model', function ($http, model) {
        var path = '/api/Courses';

        return {
            create: function (obj, success, err) {
                return model.create(path, obj, success, err);
            },
            findById: function (id, success, err) {
                return model.findById(path, id, success, err);
            },
            findAll: function (success, err) {
                return model.findAll(path, success, err);
            },
            findByIds: function (ids, success, err) {
                return model.findByIds(path, ids, success, err);
            },
            put: function (obj, success, err) {
                return model.put(path, obj, success, err);
            },
            deleteById: function (id, success, err) {
                return model.deleteById(path, id, success, err);
            },

            weather: function (obj, success, err) {
                console.debug("Course.weather: " + JSON.stringify(obj));

                var id = obj.id;
                var weatherPath = path + '/' + id + '/weather';

                $http.get(weatherPath).then(
                    function successCallback(response) {
                        console.log("Successfully got weather ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("weather failed");
                        err(response);
                    }
                );
            }
        }
    }])
    .factory('Gamer', ['$http', 'Model', function ($http, model) {
        var path = '/api/Gamers';

        return {
            create: function (obj, success, err) {
                return model.create(path, obj, success, err);
            },
            findById: function (id, success, err) {
                return model.findById(path, id, success, err);
            },
            findAll: function (success, err) {
                return model.findAll(path, success, err);
            },
            findByIds: function (ids, success, err) {
                return model.findByIds(path, ids, success, err);
            },
            put: function (obj, success, err) {
                return model.put(path, obj, success, err);
            },
            deleteById: function (id, success, err) {
                return model.deleteById(path, id, success, err);
            },

            login: function (credentials, success, err) {
                console.debug("Gamer.login: " + JSON.stringify(credentials));

                var loginPath = path + '/login';

                $http.post(loginPath, credentials).then(
                    function successCallback(response) {
                        console.log("Successfully logged in ", response.data);
                        success(response.data);
                    },
                    function errorCallback(response) {
                        console.log("login failed");
                        err(response);
                    }
                );

            }
        }
    }]);

