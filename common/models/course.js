var logger = {
    debugMode: false, // turn this on to get diagnostic info

    log: function (str) {
        console.log(str);
    },
    debug: function (str) {
        if (this.debugMode) console.log("[DEBUG] " + str);
    },
    error: function (str) {
        console.error(str);
    }
};

module.exports = function (Course) {
    var scores = require('../lib/scores.js');
    var app = require('../../server/server');
    var Weather = require('../lib/weather.js');


    Course.weather = function (id, cb) {

        console.log("getting weather for course " + id);

        // find the course information
        Course.findById(id, function (err, courserecord) {
            if (!err && courserecord) {
                var course = courserecord.attributes;

                // look for lat/long coordinates for this course
                if (course.location) {
                    var weather = new Weather();

                    var lat = course.location.lat;
                    var lng = course.location.lng;

                    weather.forecast(lat, lng)
                        .then(result => {
                            console.log("Found weather info for course " + id + ", lat=" + lat + " lng=" + lng);
                            cb(null, result);
                        })
                        .catch(e => {
                            logger.error("Weather call failed for course " + id + ", lat=" + lat + " lng=" + lng);
                            cb(err, null);
                        });

                } else {
                    logger.error("No location info for course " + id);
                    cb(err, null);
                }

            } else {
                logger.error("Error!" + JSON.stringify(err) + " courserecord " + courserecord);
                cb(err, null);
            }
        });

    };


    Course.remoteMethod(
        'weather', {
            http: {
                path: '/:id/weather',
                verb: 'get'
            },
            description: 'Get weather conditions for this course',

            accepts: [{
                arg: 'id',
                type: 'string',
                required: true
            }],
            returns: {
                arg: 'weather',
                type: 'object',
                root: true
            }
        }
    );
};