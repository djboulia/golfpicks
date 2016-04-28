/**
 * parse the current scores looking for the tournament leaders and low round(s) of the day
 * returns an object with two fields:
 *      leaders : [ array with the current tournament leaders; may be empty ],
 *      lowrounds : [ array with low round of the day; may be empty ]
 */
var JSUtils = require('./jsutils');

var getScore = function( score ) {
    if (score == "E") {
        console.log("found even score, returning zero");
        return 0;
    }
    var num = parseInt(score);
    return (isNaN(num)) ? "-" : num;
};

var isValidScore = function( score ) {
    return (isNaN(getScore(score))) ? false : true;
};

exports.getEventStats = function( eventid, eventdata ) {
    // first look for tournament leader by scanning all player scores
    // possible states for leader:
    // 1. No leader (no scores posted yet)
    // 2. Single leader
    // 3. Multi-way tie for lead
    //
    var leaders = [];

    var scores = JSUtils.clone(eventdata.scores);
    for (var i=0; i<scores.length; i++) {
        if (scores[i].pos == "1" || scores[i].pos == "T1") {
            leaders.push( scores[i] );
        }
    }

    // now look for low rounds for the day
    // sort the array by today's lowest rounds
    scores.sort( function(a, b) {
        if (isValidScore(a.today) && isValidScore(b.today)) {
            return getScore(a.today) - getScore(b.today);
        } else if (isValidScore(a.today)) {
            return -1;
        } else if (isValidScore(b.today)) {
            return 1;
        } else {    // both invalid, just sort based on string val
            return a.today < b.today;
        };
    } );

    var lowrounds = [];
    for (var i=0; i<scores.length; i++) {
        if (isValidScore(scores[i].today)) {
            if (i==0) {
                lowrounds.push( scores[i] );
            } else {
                // see if we have any ties for low round
                if (scores[0].today == scores[i].today) {
                    lowrounds.push( scores[i] );
                }
            }
        }
    }

    return { "leaders" : leaders, "lowrounds" : lowrounds };
};

