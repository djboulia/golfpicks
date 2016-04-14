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


var scores = require('./scores.js');

var cloudant = require('cloudant')({
    account: me,
    password: password
});

var db = cloudant.use(dbName);

exports.showClasses = function (req, res) {

    db.view('basicmap', 'classes', function (err, body) {
        if (!err) {
            var classes = [];
            logger.debug("listing all classes");
            body.rows.forEach(function (doc) {
                logger.debug(doc.value);

                // remove dupes and build a return list
                if (classes.indexOf(doc.value) == -1) {
                    classes.push(doc.value);
                }
            });

            res.send({
                status: "success",
                classNames: classes
            });
        } else {
            logger.error(err);
            res.status(500).send(err);
        }
    });
};

exports.showObjects = function (req, res) {
    var className = req.query.classname;
    if (!className) {
        var err = "Invalid class name!";
        logger.error(err);
        res.status(500).send(err);
        return;
    }

    db.view('basicmap', 'class', {
        key: className
    }, function (err, body) {
        if (!err) {
            var objs = [];
            logger.debug("listing all entries with className " + className);
            body.rows.forEach(function (doc) {
                logger.debug(doc.value);

                objs.push(doc.value);
            });

            res.send({
                status: "success",
                objects: objs
            });
        } else {
            logger.error(err);
            res.status(500).send(err);
        }
    });
};

exports.showObject = function (req, res) {
    var id = req.params.id;
    if (!id) {
        var err = "Invalid id!";
        logger.error(err);
        res.status(500).send(err);
        return;
    }

    db.get(id, function (err, body) {
        if (!err) {
            logger.debug("retrieving object: " + body);
            res.send({
                status: "success",
                object: body
            });
        } else {
            logger.error("Error!" + JSON.stringify(err));
            res.status(500).send(err.message);
        }
    });
};

exports.deleteObject = function (req, res) {
    var id = req.params.id;
    if (!id) {
        var err = "Invalid id!";
        logger.error(err);
        res.status(500).send(err);
        return;
    }

    db.get(id, function (err, body) {
        if (!err) {
            // now destroy the doc with this id and rev
            logger.debug("deleting object: " + id + " with rev " + body._rev);
            db.destroy(id, body._rev, function (err, body) {

                if (!err) {
                    logger.debug("deleted object: " + body);
                    body.status = "success";
                    res.send(body);
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

exports.createObject = function (req, res) {
    logger.debug("creating " + JSON.stringify(req.body));

    // do some sanity checking first
    if (!req.body || !req.body.className || !req.body.attributes) {
        var err = "Objects need class and attributes fields";
        logger.error(err);
        res.status(500).send(err);
        return;
    }

    db.insert(req.body, function (err, body) {
        if (!err) {
            // return the inserted information with id and rev filled in
            var result = {
                object: req.body,
                status: "success"
            };

            result.object._id = body.id;
            result.object._rev = body.rev;

            logger.debug("inserted object: " + JSON.stringify(result));
            res.send(result);
        } else {
            logger.error("Error!" + JSON.stringify(err));
            res.status(500).send(err.message);
        }
    });
};

exports.updateObject = function (req, res) {
    var id = req.params.id;
    if (!id) {
        var err = "Invalid id!";

        logger.error(err);
        res.status(500).send(err);

        return;
    }

    if (!req.body._id) {
        req.body._id = id; // fix up the id if it wasn't supplied
    }

    logger.debug("updating " + JSON.stringify(req.body));

    // do some sanity checking first
    if (!req.body.className || !req.body.attributes) {
        var err = "Objects need class and attributes fields";

        logger.error(err);
        res.status(500).send(err);

        return;
    }

    if (!req.body._rev) {
        var err = "Updates must include the _rev field";

        logger.error(err);
        res.status(500).send(err);

        return;
    }

    if (req.body._id != id) {
        var err = "_id field does not match supplied update id";

        logger.error(err);
        res.status(500).send(err);

        return;
    }

    // now do the update    
    db.insert(req.body, function (err, body) {
        if (!err) {
            // return the updated information with id and rev filled in
            var result = {
                object: req.body,
                status: "success"
            };

            result.object._id = body.id;
            result.object._rev = body.rev;

            logger.debug("updated object: " + JSON.stringify(result));
            res.send(result);
        } else {
            logger.error("Error!" + JSON.stringify(err));
            res.status(500).send(err.message);
        }
    });
};

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