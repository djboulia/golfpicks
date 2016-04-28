var me = '73533436-838f-4812-ae5c-1341294dd1d1-bluemix';
var password = "864416b31a5c61deec2eeab3537af0dbd2d21315ea6ffc862303d4b024b4d636";
var dbName = 'golfpicks';


var logger = {
    debugMode: false,   // turn this on to get diagnostic info
    
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


var scores = require('../../common/lib/scores.js');

var cloudant = require('cloudant')({
    account: me,
    password: password
});

var db = cloudant.use(dbName);

exports.showScore = function (req, res) {
    var id = req.params.id;
    if (!id) {
        var err = "Invalid id!";

        logger.error(err);
        res.status(500).send(err);
        return;
    }

    db.get(id, function (err, eventrecord) {
        if (!err) {
            logger.log("called showScore for id " + id);

            var event = eventrecord.attributes;
            var courseid;

            if (event.rounds && event.rounds.length > 0) {
                // use the first day's course as the course for all rounds
                courseid = event.rounds[0].course;
            } else {
                var str = "Invalid event object, no round info!";

                logger.error(str);
                res.status(500).send(str);

                return;
            }

            // find the course information
            db.get(courseid, function (err, courserecord) {
                if (!err) {

                    var course = courserecord.attributes;

                    // call the scoring service
                    scores.get(id, event, course, {
                        success: function (scores) {

                            // return the result
                            res.send(scores);
                        },
                        error: function (err) {
                            logger.error("Error!" + JSON.stringify(err));
                            res.status(500).send(err.message);

                        }
                    });

                } else {
                    logger.error("Error!" + JSON.stringify(err));
                    res.status(500).send(err.message);
                }
            });

        } else {
            logger.error("Error!" + JSON.stringify(err));
            res.status(500).send(err.message);
        }
    });
};
