angular.module('GolfPicks.weatherData', [])
    .factory('weatherData', ['$http', function ($http) {

        var key = "edace3c3e40fa98d";
        var weatherUrl = "https://api.wunderground.com/api/" + key + "/conditions/q/";

        kelvinToFahrenheit = function (value) {
            return (kelvinToCelsius(value) * 1.8) + 32;
        };

        kelvinToCelsius = function (value) {
            return value - 273.15;
        };

        metersPerSecToMilesPerHour = function (value) {
            return value * 2.236936;
        };

        return {

            forecast: function (lat, lng, callbacks) {
                var url = weatherUrl + lat + "," + lng + ".json";

                $http.get(url)
                    .then(
                        function (data) {
                            if (callbacks && callbacks.success) {
                                var current = data.data.current_observation;
                                
//                                console.log("weather conditions: " + JSON.stringify(data));

                                var tempf = current.temp_f;
                                var tempc = current.temp_c;
                                var windmph = current.wind_mph;
                                var windkph = current.wind_kph;
                                var icon = current.icon_url;

                                callbacks.success({
                                    temp: tempf,
                                    wind: windmph,
                                    icon: icon,
                                    metric: {
                                        temp: tempc,
                                        wind: windkph
                                    }
                                });
                            }
                        },
                        function (response) { // error
                            console.log("weather data error: " + response);
                            if (callbacks && callbacks.error) callbacks.error(response);
                        });

            }
        }

}]);