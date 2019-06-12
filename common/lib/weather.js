var JsonRequest = require('./pgascores/jsonrequest.js');

var Weather = function () {
    var weatherUrl = function(lat, lng) {
        var url = "https://d3b706b6-43a0-4617-9f22-d2a36681833e:yTVb68XWB9@twcservice.mybluemix.net/api/weather/v1/geocode/";
        url = url + lat + "/" + lng + "/observations.json?language=en-US";
        return url;
    }

    var fahrenheitToCelsius = function (value) {
        return (value - 32) * 5 / 9;            
    };

    var mphToKPH = function (value) {
        return value * 1.609344;
    };


    this.forecast = function (lat, lng) {
        return new Promise((resolve, reject) => {

            var url = weatherUrl(lat, lng);
            var request = new JsonRequest(url);

            request.get()
                .then(data => {
                    console.log("weather: " + JSON.stringify(data));

                    var current = data.observation;

                    //                                console.log("weather conditions: " + JSON.stringify(data));

                    var tempf = current.temp;
                    var tempc = Math.round(fahrenheitToCelsius(current.temp));
                    var windmph = current.wspd;
                    var windkph = Math.round(mphToKPH(current.wspd));
                    var icon = current.wx_icon;

                    resolve({
                        temp: tempf,
                        wind: windmph,
                        icon: icon,
                        metric: {
                            temp: tempc,
                            wind: windkph
                        }
                    });

                })
                .catch(e => {
                    console.log("weather data error: " + e);
                    reject(e);
                });

        });
    };

};

module.exports = Weather;