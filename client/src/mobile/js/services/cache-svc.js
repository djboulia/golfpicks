console.log("loading GolfPicksMobile.cache");

angular.module('GolfPicksMobile.cache', [])
    .factory('gameDataCache', function () {
        var _data = {};
    
        return {

            clearAll: function () {
                _data = {};
            },

            clear: function (id) {
                _data[id] = undefined;
            },

            set: function (id, data) {
                _data[id] = data;
            },

            get: function (id) {
                return _data[id];
            }

        }
    });