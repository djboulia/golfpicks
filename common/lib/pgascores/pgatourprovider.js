/**
 *
 *	Get the world rankings from the PGA tour site.  See yahooprovider.js for another
 * 	option.  The PGA tour site gives the more complete list of world rankings
 *  (through 1000 players).
 *  The Yahoo site has the same info but is limited to the top 250 players.
 *
 **/

var request = require('request');
var cheerio = require('cheerio');
var NameUtils = require('./nameutils.js');

var _thisYear = function () {
    return new Date().getFullYear();
};

var _formatStrokes = function (round, status, roundinfo) {
    var strokes = roundinfo.strokes;

    if (strokes == null) {
        if (status == "cut") {
            return "MC";
        } else if (status = "active") {
            // if round hasn't started yet, see if a tee time can be supplied
            if (roundinfo.tee_time) {
                return _formatTeeTime(new Date(roundinfo.tee_time));
            }
        }

        // default to '-' when all else fails
        return '-';

    } else {
        return strokes;
    }
};

var _formatTeeTime = function (theDate) {
    if (theDate) {
        var hours = theDate.getUTCHours();
        var ampm = "am";

        if (hours > 12) {
            ampm = "pm";
            hours = hours - 12;
        } else if (hours == 12) {
            ampm = "pm";
        } else if (hours == 0) {
            hours = 12;
        }

        var minutes = theDate.getUTCMinutes();
        if (minutes < 10) minutes = "0" + minutes;

        return hours + ":" + minutes + " " + ampm;
    } else {
        return "(invalid time)";
    }
};

// is there a current round in progress?  we define that as
// an active player who is thru less than 18 holes.  we want
// to show live scoring of the number of strokes in this round
var _roundInProgress = function (player) {
    return player.status == "active" && player.thru && player.thru < 18;
};

/**
 *
 * For live scoring during an event, we go to the PGA tour site data feed
 * This comes in as a JSON document with the live leaderboard data
 *
 **/
var _getCurrentEvent = function (event, course, callback) {
    console.log("Event " + JSON.stringify(event));

    var url = "http://www.pgatour.com/data/r/" + event.tournament_id + "/leaderboard-v2.json?ts=" + Date.now();
    console.log("url : " + url);

    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var obj = JSON.parse(html);

            /**
             *
             * the format of the JSON object is rather complex, but the part we care about is
             * the leaderboard data structure
             *
               { ...

            	 leaderboard : {
            		players: [
            			{ player_bio : { first_name: "Bubba", last_name: "Watson" },
            			  rounds :  [
            							{ "round_number" : 1, "strokes" : 180 },  ...
            						],
            		    }, ...
            			]
            	}}
             *
             */

            var records = [];

            for (var i = 0; i < obj.leaderboard.players.length; i++) {

                var player = obj.leaderboard.players[i];
                var bio = player.player_bio;
                var rounds = obj.leaderboard.players[i].rounds;
                // console.log( "found player " + i + " name: " +bio.first_name + " " + bio.last_name);
                // console.log( "rounds " + JSON.stringify(rounds) );
                // console.log( "status " + player.status );
                // console.log( "current_position " + player.current_position );
                // console.log( "thru " + player.thru );
                // console.log( "today " + player.today );
                // console.log( "total " + player.total );
                // console.log( "strokes " + player.total_strokes );

                var record = {
                    "name": bio.first_name + " " + bio.last_name,
                    "pos": player.current_position,
                    "thru": player.thru ? player.thru : '-',
                    "today": _netScore(player.today),
                    "total": _netScore(player.total),
                    "strokes": player.total_strokes ? player.total_strokes : '-',
                    "1": '-',
                    "2": '-',
                    "3": '-',
                    "4": '-'
                };

                if (_roundInProgress(player)) {

                    // handle in progress rounds specially to give live scoring stats
                    console.log("in progress player: " + JSON.stringify(player));

                    var total_strokes = player.total_strokes;

                    for (var j = 0; j < rounds.length; j++) {
                        var round = rounds[j];
                        var round_number = round["round_number"];

                        if (round.strokes != null) {
                            // full round score exists here, keep it
                            // and subtract this day's score from the total
                            record[round_number] = round.strokes;
                            total_strokes = total_strokes - round.strokes;
                        } else {
                            // [djb 06/15/2017] total_strokes no longer provides the in round
                            //                  totals... during the round it can be null, so
                            //                  account for that here.
                            if (total_strokes != null) {
                                // incomplete round, plug in the total strokes here and get out
                                record[round_number] = total_strokes;
                            }
                            break;
                        }
                    }

                    console.log("Created in progress record: " + JSON.stringify(record));

                } else {
                    for (var j = 0; j < rounds.length; j++) {
                        var round_number = rounds[j]["round_number"];
                        var time = (rounds[j].tee_time) ? _formatTeeTime(new Date(rounds[j].tee_time)) : "no time available";

                        // console.log( "round " + round_number + " strokes: " + rounds[j].strokes + " time: " + time );

                        record[round_number] = _formatStrokes(round_number, player.status, rounds[j]);

                        // [djb 04/13/2016] pos field is blank when player is cut or withdraws,
                        // set pos to CUT or WD to normalize with other data sources
                        //
                        if (player.status == 'cut') {
                            record["pos"] = "CUT";
                        } else if (player.status == 'wd') {
                            record["pos"] = "WD";
                        }
                    }
                }


                records.push(record);
                //                console.log(record);
            }


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
}

var _netScore = function (net) {
    if (net == null) {
        return '-';
    }

    if (net > 0) {
        return "+" + net;
    } else if (net == 0) {
        return "E";
    } else {
        return net.toString();
    }
}

var _getLastDayNet = function (event, score) {
    if (score == '') return '-'; // no score for the last day

    var net = parseInt(score) - event.par;
    return _netScore(net);
}

var _getTotalNet = function (event, record) {
    if (record["1"] == '')
        return '-';
    if (record["2"] == '')
        return '-';
    if (record["3"] == '')
        return '-';
    if (record["4"] == '')
        return '-';

    var net = record["strokes"] - (event.par * 4);
    return _netScore(net);
}

var _fixEmptyRoundScore = function (round, record) {
    var score = record[round];
    var pos = record["pos"];

    if (score == "") {
        if (pos == "W/D") {
            return "WD";
        } else if (pos == "CUT" && round > 2) {
            return "MC";
        } else {
            return "-";
        }
    } else {
        return score;
    }
}

/**
 * For past events, go to the PGA tour site archive
 **/
var _getPastEvent = function (event, course, callback) {
    console.log("Event " + JSON.stringify(event));

    var start = new Date(event.start)
    var year = start.getFullYear();

    var url = "http://www.pgatour.com/content/pgatour/tournaments/" + event.baseurl + "/past-results/jcr:content/mainParsys/pastresults.selectedYear." + year + ".html";
    console.log("url : " + url);

    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {

            var $ = cheerio.load(html);

            // get table data
            var table = $('table.table-styled');
            if (table == undefined) {
                console.log("Couldn't find event table!");
                callback(null);
                return;
            }

            var row = 0;
            var records = [];

            // process each row in the table
            $('tr', table).each(function (i, tr) {
                // skip first two header rows
                if (row > 2) {
                    var record = {};

                    var td = $('td', tr);
                    if (td.each != undefined) {
                        var ndx = 0;
                        td.each(function (i, el) {
                            var key = "";

                            // build out the fields we want to keep
                            // should be in the order:
                            switch (ndx) {
                                case 0:
                                    key = "name";
                                    break;

                                case 1:
                                    key = "pos";
                                    break;

                                case 2:
                                    key = "1";
                                    break;

                                case 3:
                                    key = "2";
                                    break;

                                case 4:
                                    key = "3";
                                    break;

                                case 5:
                                    key = "4";
                                    break;

                                case 6:
                                    key = "strokes";
                                    break;

                                case 7:
                                    key = "purse";
                                    break;

                                default:
                            }

                            // [djb 4-7-2015] replace whitespace with spaces to resolve encoding issues
                            if (key != "") record[key] = $(this).text().replace(/\s/g, ' ').trim();

                            ndx++;
                        });


                        // calculate the last day score relative to par
                        record["today"] = _getLastDayNet(course, record["4"]);
                        record["total"] = _getTotalNet(course, record);

                        // translate any empty round scores into an appropriate format
                        for (var i = 1; i <= 4; i++) {
                            record[i] = _fixEmptyRoundScore(i, record);
                        }

                        // normalize to our data format
                        if (record["pos"] == "W/D") {
                            record["pos"] = "WD";
                        }

                        records.push(record);
                        //                        console.log(record);

                        //						console.log( "row=" + row + " name=" + record.name);
                    }


                }

                row++;
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
            console.log("Error retrieving page: " + JSON.stringify(response));
            callback(null);
        }
    });
}

/**
 * expects Last,<sp>First format and will return First<sp>Last
 **/
var _reverseName = function (str) {
    var parts = str.split(",");
    if (parts.length < 2) {
        console.log("_reverseName: warning, couldn't reverse name " + str);
        return str;
    } else {
        return parts[1].trim() + " " + parts[0].trim();
    }
}

/**
 * For upcoming events, the PGA tour site won't show the leaderboard until the day of, so
 * until then we have to parse the field
 *
 * djb [04/03/2017] had to change this to adapt to changes in the pgatour site
 *
 **/
var _getFutureEvent = function (event, course, callback) {

    console.log("Event " + JSON.stringify(event));

    var fieldUrl = "http://www.pgatour.com/data/r/" + event.tournament_id + "/field.json";
    console.log("Getting field info from: " + fieldUrl);

    request(fieldUrl, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse( html );

            if (!json.Tournament || !json.Tournament.Players) {
                console.log(JSON.stringify(json));

                console.log("Didn't get the right JSON object back!");
                callback(null);
                return;
            }

            var records = [];

            for (var i = 0; i < json.Tournament.Players.length; i++) {
                var player = json.Tournament.Players[i];
                var record = {};

                record["name"] = _reverseName(player.PlayerName.replace(/\s/g, ' ')).trim();
                record["1"] = "-";
                record["2"] = "-";
                record["3"] = "-";
                record["4"] = "-";
                record["pos"] = "-";
                record["today"] = "-";
                record["thru"] = "-";
                record["total"] = "-";
                record["strokes"] = "-";

                records.push(record);
            }

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
            console.log("Error retrieving page: " + JSON.stringify(response));
            callback(null);
        }
    });
}


/**
 *
 * returns an array of objects of the form:
 		[ { "player_id" : "tiger_woods", "rank" : 0, "name" : "Tiger Woods" },
 		  { "player_id" : "phil_michelson", "rank" : 2, "name" : "Phil Mickelson" }, ... ];
 **/
var _getPGARankings = function (year, callback) {

    var url = "http://www.pgatour.com/stats/stat.186";

    if (year == _thisYear()) {
        url = url + ".html";
    } else {
        // prior years are at a url of the form http://www.pgatour.com/stats/stat.186.YYYY.html
        url = url + "." + year.toString() + ".html";
    }

    console.log("PGA rankings url for year " + year + ": " + url);

    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {

            var $ = cheerio.load(html);

            // get table data
            var table = $('table#statsTable');
            if (table == undefined) {
                console.log("Couldn't find rankings!");
                callback(null);
                return;
            }

            var row = 0;
            var records = [];

            var tbody = $('tbody', table);
            if (!tbody) {
                console.log("Couldn't find rankings!");
                callback(null);
                return;
            }

            // process each row in the table
            $('tr', tbody).each(function (i, tr) {

                var record = {};

                var td = $('td', tr);
                if (td.each != undefined) {
                    var ndx = 0;
                    td.each(function (i, el) {

                        var key = "";

                        // build out the fields we want to keep
                        // should be in the order:
                        switch (ndx) {
                            case 0:
                                key = "rank";
                                break;

                            case 2:
                                key = "name";
                                break;

                            default:
                        }

                        // [djb 4-7-2015] replace whitespace with spaces to resolve encoding issues
                        if (key != "") record[key] = $(this).text().replace(/\s/g, ' ').trim();

                        ndx++;
                    });

                    if (record.name) {

                        record.player_id = NameUtils.normalize(record.name);

                        records.push(record);
                    } else {
                        console.log("found invalid record = " + JSON.stringify(record));
                    }

                    //				console.log( "row=" + row + " player_id=" + record.player_id +
                    //							 "name=" + record.name + " rank=" + record.rank );
                }

                row++;
            });

            callback(records);
        }
    });
}

var tournamentComplete = function (start, end) {
    end = end + (1000 * 59 * 60 * 24); // go to end of the day

    console.log("tournamentComplete: " + start + ", ending " + end);
    return end < Date.now();
}

var tournamentInProgress = function (start, end) {
    var now = Date.now();
    end = end + (1000 * 59 * 60 * 24); // go to end of the day

    console.log("tournamentInProgress: start: " + start + " end: " + end + " now: " + now);

    return (now > start) && (now < end);
}

var isCurrentYear = function (date) {
    var theDate = new Date(date);
    console.log("input year = " + theDate.getFullYear() + " current year = " + _thisYear());
    return theDate.getFullYear() == _thisYear();
}


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

    console.log("start = " + start + " end = " + end);

    if (tournamentInProgress(start, end) || (tournamentComplete(start, end) && isCurrentYear(end))) {
        console.log("about to call …getCurrentEvent");

        _getCurrentEvent(event, course, function (eventdata) {
            if (eventdata == null) {

                console.log("PGA current event call failed!");
                callback(null);

            } else {

                callback(eventdata);
            }
        });
    } else if (tournamentComplete(start, end)) {
        console.log("about to call …getPastEvent");

        // must be an upcoming tournament, load the field of participants
        _getPastEvent(event, course, function (eventdata) {
            if (eventdata == null) {

                console.log("PGA prior event call failed!");
                callback(null);

            } else {

                callback(eventdata);
            }
        });

    } else {
        console.log("about to call …getFutureEvent");

        // must be an upcoming tournament, load the field of participants
        _getFutureEvent(event, course, function (eventdata)
            // _getCurrentEvent(event, function(eventdata)
            {
                if (eventdata == null) {

                    console.log("PGA future event call failed!");
                    callback(null);

                } else {

                    callback(eventdata);
                }
            });
    }

};

/**
 *	getRankings		: return current world rankings for PGA tour players
 *
 *	@year			: rankings year to return.  if year is in current year, will be the
 *					  latest world rankings for players
 *
 *	@callback 		: will be called back with eventdata as only argument
 *		 			  eventdata : array of ranking data
 */
exports.getRankings = function (year, callback) {

    console.log("about to call _getPGARankings");

    _getPGARankings(year, function (eventdata) {
        if (eventdata == null) {

            console.log("PGA Tour rankings call failed!");
            callback(null);

        } else {
            console.log("rankings: " + JSON.stringify(eventdata));
            callback(eventdata);
        }
    });

};
