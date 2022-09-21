// 
// wrapper the tourdata REST interface.  this provides rankings and
// tour schedule information as an alternative to going straight to
// the PGA or golf channel sites
//
var JsonRequest = require('./jsonrequest.js');

const url = process.env.TOURDATA_URL;

var getBaseUrl = function () {
    if (!url) {
        console.log('TOURDATA_URL environment variable not found!');
    }

    return url;
};

var TourData = function (year) {
    var getRankingsUrl = function (year) {
        var url = getBaseUrl() + "/rankings/search?tour=pga&year=" + year;
        return url;
    };

    var getEventUrl = function (year, id) {
        var url = getBaseUrl() + "/tournaments/" + year + "/tour/pga/event/" + id + "?details=false";
        return url;
    };

    this.getRankings = function () {
        var url = getRankingsUrl(year);
        console.log("url : " + url);

        var request = new JsonRequest(url);

        return new Promise((resolve, reject) => {
            request.get()
                .then(json => {
                    resolve(json);
                })
                .catch((e) => {
                    console.log("Error retrieving url " + url);
                    reject(e);
                });
        });

    };

    this.getEvent = function (id) {
        var url = getEventUrl(year, id);
        console.log("url : " + url);

        var request = new JsonRequest(url);

        return new Promise((resolve, reject) => {
            request.get()
                .then(json => {
                    resolve(json);
                })
                .catch((e) => {
                    console.log("Error retrieving url " + url);
                    reject(e);
                });
        });

    };
};

module.exports = TourData;