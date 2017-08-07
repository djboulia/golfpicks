/**
 *
 *	Get the world rankings from the Golf Channel site.  See pgatourprovider.js for another
 * 	option.
 *
 *  The PGA tour site is flaky with historical data... it used to have the PGA championship
 *  past leaderboards (prior to 2016) but then stopped listing past events.  The Golf Channel
 *  seems to have the data, so we use that for some tournaments.
 *
 **/

var request = require('request');
var cheerio = require('cheerio');
var nameUtils = require('./nameutils.js');
var gameUtils = require('./gameutils.js');

var isValidScore = function (score) {
    // if it has anything but digits, that's bad
    if (String(score).search(/^\s*\d+\s*$/) != -1) {
        return true;
    }

    return false;
};

var withdrewFromTournament = function (record) {
    var pos = record["pos"];

    return pos == "WD";
};

//
// The Golf Channel lists scores for the round even if the player withdrew
// mid round (e.g. due to injury).  These are somewhat bogus since they represent
// an incomplete round that's not a useful score.  Other providers like pgatour.com
// don't show these partial round scores.
// we try to look for invalid scores like this and just reset them to
// blank so that it doesn't invalidate other stats like low round of the day
//
var fixMidRoundWithdrawal = function (record, par) {
    if (withdrewFromTournament(record)) {

        // walk backward looking for last round with a score
        for (var i = 4; i > 0; i--) {
            if (isValidScore(record[i])) {

                // is the score bogus relative to par?  For our purposes we'll assume
                // anything more than 5 under is bogus when a player withdraws
                if ((parseInt(record[i]) - par) < -5) {
                    console.log("Changing round " + i + " score to WD in record " + JSON.stringify(record));

                    record[i] = "WD";
                    break;
                }
            }
        }

    }

    return record;
};

var fixEmptyRoundScore = function (round, record) {
    var score = record[round];
    var pos = record["pos"];

    if (score == "") {
        if (pos == "WD") {
            return "WD";
        } else if (pos == "CUT" && round > 2) {
            return "MC";
        } else if (pos == 'DNS') {
            return "DNS";
        } else {
            return "-";
        }
    } else {
        return score;
    }
};

//
// normalize golf channel name format to our standard
//
var formatName = function (record) {
    var name = record["name"];

    // if players started on back nine, they will have an asterisk at the
    // end of their name.  remove that
    if (name.slice(-1) == "*") {
        name = name.slice(0, -1);
    }

    // golf channel puts them in last, first.  we want it to be [first] [last]
    return nameUtils.reverseName(name).trim();
}

//
// if you didn't make the cut (CUT), withdrew (WD), or did not start (DNS)
// you didn't finish the tournament
//
var playerFinishedTournament = function (record) {
    var finished = true;
    var pos = record["pos"];

    if (pos == "WD") {
        finished = false;
    } else if (pos == "CUT") {
        finished = false;
    } else if (pos == "DNS") {
        finished = false;
    }

    return finished;
};

//
// labels for the fields we want to keep
//
var fields = [
    "", // 0: don't keep this field, which has no data
    "pos", // 1: position on the leaderboard
    "", // 2: don't keep this field, which has movement up/down the rankings (not interesting)
    "name", // 3: player name
    "total",
    "thru",
    "today",
    "1", // 7-10: scores for each round
    "2",
    "3",
    "4",
    "strokes" // 11: total number of strokes
];

//
// for live scoring, the golf channel will adjust the table to show a tee time
// instead of the normal scoring.  this ste of fields adjusts for that case
//
var fieldsTeeTime = [
    "", // 0: don't keep this field, which has no data
    "pos", // 1: position on the leaderboard
    "", // 2: don't keep this field, which has movement up/down the rankings (not interesting)
    "name", // 3: player name
    "total",
    "",
    "1", // 6-9: scores for each round
    "2",
    "3",
    "4",
    "strokes" // 10: total number of strokes
];
var POS_TEETIME = 5;

// walk through the table rows, calling the callback for each
// row we find.  callback will take two parameters: the index of the row (zero based) and an
// array of text elements representing each cell in the row
//
// NOTE: due to HTML colspan attributes, each array of rowData could be a different size
//
var processTableRows = function ($, table, callback) {
    var row = 0;

    $('tr.playerRow', table).each(function (i, tr) {
        var rowData = [];

        var td = $('td', tr);

        if (td.each != undefined) {

            td.each(function (i, el) {
                // replace whitespace with spaces to resolve encoding issues
                var cell = $(this).text().replace(/\s/g, ' ').trim();

                rowData.push(cell);
            });

            console.log("row " + row + "= " + JSON.stringify(rowData));

        } else {
            // no elements in the row
            console.log("warning! no elements in table row " + row);
        }

        if (callback) callback(row, rowData);

        row++;
    });

};

// for well formatted rows, we want to return a record with the following fields in it
// pos, name, total, thru, today, 1, 2, 3, 4, strokes
//
var formatRowData = function (rowData) {
    var record = undefined;

    if (rowData.length == fields.length) {
        // easy case... just map fields to cells
        record = {};

        for (var i = 0; i < fields.length; i++) {
            var key = fields[i];

            if (key != '') {
                record[key] = rowData[i];
            }
        }
    } else if (rowData.length == fieldsTeeTime.length) {
        // here we need to do some mapping to get the right type of record
        // since the tee time info will screw up the field mapping
        record = {};

        for (var i = 0; i < fieldsTeeTime.length; i++) {
            var key = fieldsTeeTime[i];

            if (key != '') {
                record[key] = rowData[i];
            }
        }

        // in this case the 'thru' and 'today' fields are replaced with
        // the tee time info.  since the player hasn't teed off yet today
        // we set these values accordingly
        record['thru'] = '-';
        record['today'] = '-';

        // insert the tee time into the first blank round
        var teetime = rowData[POS_TEETIME];

        for (var rnd = 1; rnd <= 4; rnd++) {
            var key = rnd.toString();

            if (record[key] == '') {
                record[key] = teetime;
                break;
            }
        }
    } else {
        console.log("warning: found row with " + rowData.length + " elements");
    }

    return record;
};


//
// main entry point for getting scores
//
var getEvent = function (event, course, callback) {
    console.log("Event " + JSON.stringify(event));

    var start = new Date(event.start)
    var year = start.getFullYear();

    var url = "http://www.golfchannel.com/tours/" + event.tour + "/" + year + "/" + event.baseurl + "/";
    console.log("url : " + url);

    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {

            var $ = cheerio.load(html);

            // get table data
            var table = $('table.gc_leaderboard');
            if (table == undefined) {
                console.log("Couldn't find event table!");
                callback(null);
                return;
            }

            var row = 0;
            var records = [];

            processTableRows($, table, function (row, rowData) {
                var record = formatRowData(rowData);

                console.log("formatted record " + JSON.stringify(record));

                if (!record) {
                    // unrecognized format
                    console.log("warning: unrecognized row data " + JSON.stringify(rowData));
                } else {
                    // do post processing on the data

                    record["name"] = formatName(record);

                    // translate any empty round scores into an appropriate format
                    for (var i = 1; i <= 4; i++) {
                        record[i] = fixEmptyRoundScore(i, record);
                    }

                    // The Golf Channel site puts scores in even for players who didn't
                    // make the cut, withdrew, etc.  We fix that here
                    if (!playerFinishedTournament(record)) {
                        record["today"] = '-';
                        record["thru"] = '-';
                    }

                    if (withdrewFromTournament(record)) {
                        record = fixMidRoundWithdrawal(record, course.par);
                    }

                    // strokes can be blank if the player hasn't started yet.  fix that
                    if (!isValidScore(record["strokes"])) {
                        record["strokes"] = '-';
                    }

                    if (gameUtils.tournamentComplete(event) && record["4"] == "-") {
                        // some tournaments implement a "secondary cut" after round 3
                        // check for that and set to MDF which means Made Cut - Did not Finish
                        console.log("Setting round 4 score to MDF in record " + JSON.stringify(record));
                        record["4"] = "MDF";
                        record["today"] = '-';
                        record["thru"] = '-';
                    }

                    console.log(JSON.stringify(record));

                    records.push(record);
                }

            });

            var courseInfo = {
                "course": course.name,
                "par": course.par.toString(),
                "yardage": course.yardage.toString()
            };

            callback({
                "name": event.name,
                "course": courseInfo,
                "scores": records,
                "created_at": new Date()
            });
        } else {
            console.log("Error retrieving page: " + url);
//            console.log("Error retrieving page: " + JSON.stringify(response));
            callback(null);
        }
    });
};


/**
 *	getEvent
 *
 *	@event 			: event details
 *	@course 		: course details
 *	@callback 		: will be called back with eventdata as only argument
 *		 			  eventdata : hash of event keys, tournament descriptions
 */
exports.getEvent = function (event, course, callback) {

    var start = Date.parse(event.start);
    var end = Date.parse(event.end);

    console.log("golfchannelprovider.getEvent: start = " + start + " end = " + end);

    getEvent(event, course, function (eventdata) {
        if (eventdata == null) {

            console.log("Golf channel provider PGA event call failed!");
            callback(null);

        } else {

            callback(eventdata);
        }
    });
};
