var JsonRequest = require('./pgascores/jsonrequest.js');
const Cache = require('./cache.js');

const weatherCache = new Cache(10*60); // 10 minutes

var Weather = function () {
    var weatherUrl = function (lat, lng) {
        var url = "http://api.openweathermap.org/data/2.5/weather?" +
            "units=imperial&lat=" + lat + "&lon=" + lng +
            "&appid=2667370f091820d213dc04e0c9176993";
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

            console.log("weather url " + url);

            const key = lat + ',' + lng;
            const entry = weatherCache.get(key);

            if (entry) {
                console.log("Returning cached weather ", entry);
                resolve(entry);
                return;
            }

            // not cached, go get it
            request.get()
                .then(data => {
                    console.log("weather: " + JSON.stringify(data));


                    const main = data.main;
                    const tempf = main.temp;
                    const tempc = Math.round(fahrenheitToCelsius(tempf));

                    const wind = data.wind;
                    const windmph = wind.speed;
                    const windkph = Math.round(mphToKPH(windmph));

                    const weather = data.weather[0];
                    const icon = "http://openweathermap.org/img/w/" + weather.icon + ".png";

                    const obj = {
                        temp: tempf,
                        wind: windmph,
                        icon: icon,
                        metric: {
                            temp: tempc,
                            wind: windkph
                        }
                    };

                    // save in cache for next time
                    weatherCache.put(key, obj);

                    resolve(obj);

                })
                .catch(e => {
                    console.log("weather data returned error: " + e);
                    reject(e);
                });

        });
    };

};

module.exports = Weather;