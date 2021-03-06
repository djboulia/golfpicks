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


module.exports = function (Event) {
    var scores = require('../lib/scores.js');
    var app = require('../../server/server');
    var Weather = require('../lib/weather.js');

    Event.scores = function (id, cb) {
        var Course = app.models.Course;

        console.log("getting scores for event " + id);

        Event.findById(id, function (err, eventrecord) {
            if (!err && eventrecord) {
                logger.log("called showScore for id " + id);

                var event = eventrecord.attributes;
                var courseid;

                if (event.rounds && event.rounds.length > 0) {
                    // use the first day's course as the course for all rounds
                    courseid = event.rounds[0].course;
                } else {
                    var str = "Invalid event object. No round info found!";

                    logger.error(str);
                    cb(str, null);

                    return;
                }

                console.log("finding course " + courseid);

                // find the course information
                Course.findById(courseid, function (err, courserecord) {
                    if (!err && courserecord) {
                        var course = courserecord.attributes;

                        // call the scoring service
                        scores.get(id, event, course, {
                            success: function (scores) {

                                // return the result
                                cb(null, scores);
                            },
                            error: function (err) {
                                logger.error("Error!" + JSON.stringify(err));
                                cb(err, null);
                            }
                        });

                    } else {
                        logger.error("Error!" + JSON.stringify(err) + " courserecord " + courserecord);
                        cb(err, null);
                    }
                });

            } else {
                if (!eventrecord) {
                    var str = "Could not find event id " + id;
                    logger.error(str);
                    cb(str, null);
                } else {
                    logger.error("Error!" + JSON.stringify(err));
                    cb(err, null);
                }
            }
        });

    };

    Event.weather = function (id, cb) {
        var Course = app.models.Course;

        console.log("getting weather for event " + id);

        Event.findById(id, function (err, eventrecord) {
            if (!err && eventrecord) {
                logger.log("found id " + id);

                var event = eventrecord.attributes;
                var courseid;

                if (event.rounds && event.rounds.length > 0) {
                    // use the first day's course as the course for all rounds
                    courseid = event.rounds[0].course;
                } else {
                    var str = "Invalid event object. No round info found!";

                    logger.error(str);
                    cb(str, null);

                    return;
                }

                console.log("finding course " + courseid);

                // find the course information
                Course.weather(courseid, function (err, result) {
                    if (!err && result) {
                        cb(null, result);
                    } else {
                        logger.error("No location info for course " + courseid);
                        cb(err, null);
                    }
                });

            } else {
                if (!eventrecord) {
                    var str = "Could not find event id " + id;
                    logger.error(str);
                    cb(str, null);
                } else {
                    logger.error("Error!" + JSON.stringify(err));
                    cb(err, null);
                }
            }
        });

    };

    Event.remoteMethod(
        'scores', {
            http: {
                path: '/:id/scores',
                verb: 'get'
            },
            description: 'Get golfer scores for this event',

            accepts: [{
                arg: 'id',
                type: 'string',
                required: true
            }],
            returns: {
                arg: 'scores',
                type: 'object',
                root: true
            }
        }
    );

    Event.remoteMethod(
        'weather', {
            http: {
                path: '/:id/weather',
                verb: 'get'
            },
            description: 'Get weather conditions for this event',

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