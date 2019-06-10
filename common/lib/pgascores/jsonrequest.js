// 
// wrap a basic REST request over HTTP and format in/out values in JSON
//
var request = require('request');

var JsonRequest = function (url) {

    this.get = function () {
        return new Promise((resolve, reject) => {
            request.get(url, (error, response, body) => {

                var json = null;

                if (!error) {
                    json = JSON.parse(body);
                    resolve(json);
                } else {
                    console.log("Error!: " + error);
                    reject(error);
                }
            });
        });
    }

    this.post = function (data) {
        var options = {
            uri: url,
            method: 'POST',
            json: data
        };

        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {

                var json = null;

                if (!error) {
                    // the body comes back pre-parsed as a JSON object
                    // so just assign it directly here
                    json = body;
                    resolve(json);
                } else {
                    console.log("Error!: " + error);
                    reject(error);
                }
            });
        });

    }

};

module.exports = JsonRequest;