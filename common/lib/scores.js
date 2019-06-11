var TourData = require('./pgascores/tourdata.js');
var NameUtils = require('./pgascores/nameutils.js');

//
// pick up common abbreviations for first names
// e.g. Alex is an abbreviation of Alexander
//
var sameFirstName = function (firstName1, firstName2) {
    var names = {
        'alexander': ["alex"],
        'soren': ["søren"],
        'william': ["bill", "billy", "will", "willy"]
    };

    // do the simple check first
    if (firstName1 == firstName2) {
        return true;
    }

    var key;
    for (key in names) {

        var nicknames = names[key];

        if (key == firstName1) {

            for (var i = 0; i < nicknames.length; i++) {
                if (nicknames[i] == firstName2) {
                    return true;
                }
            }
        } else if (key == firstName2) {

            for (var i = 0; i < nicknames.length; i++) {
                if (nicknames[i] == firstName1) {
                    return true;
                }
            }
        }
    }

    return false;
}


// attempts to match name1 and name2
// returns:
// -1 : no matching components
//  0 : perfect match
//  1 : last name match
//  2 : last name and first letter of first name match
//  3 : last name and first name match
//
// to improve matching chances, we normalize case and remove punctuation
var fuzzyMatch = function (name1, name2) {
    name1 = name1.toLowerCase().replace(/[,\.\']/g, ''); // remove any punctuation
    name2 = name2.toLowerCase().replace(/[,\.\']/g, ''); // remove any punctuation

    // convert whitespace into matchable space characters
    name1 = name1.replace(/\s/g, ' ');
    name2 = name2.replace(/\s/g, ' ');

    // try the easiest thing first
    if (name1 == name2) {
        //		console.log( "found match at name1:'" + name1 + "' name2:'" + name2 + "'");
        return 0;
    }

    var words1 = name1.split(/\s/g);
    //	console.log( JSON.stringify( "words 1:" + words1 ) );
    var words2 = name2.split(/\s/g);
    //	console.log( JSON.stringify( "words 2:" + words2 ) );

    var result = 0;

    // compare last names first
    var word1 = words1.pop();
    var word2 = words2.pop();

    if (word1 == word2) {
        result++;

        // see if the last name was a modifier like jr, i, ii, iii
        if (word1 == "jr" || word1 == "i" || word1 == "ii" || word1 == "iii") {
            // then compare next to last word
            if (words1.length > 0 && words2.length > 0) {
                word1 = words1.pop();
                word2 = words2.pop();
                if (word1 == word2) {
                    result++;
                }
            }
        }

        // now look at first name
        if (words1.length > 0 && words2.length > 0) {
            word1 = words1.shift();
            word2 = words2.shift();
            if (sameFirstName(word1, word2)) {
                result++;

                // finally look at remainder
                while (words1.length > 0 && words2.length > 0) {
                    word1 = words1.pop();
                    word2 = words2.pop();
                    if (word1 == word2) {
                        result++;
                    } else {
                        break;
                    }
                }
            }
        }

    }


    if (result > 0) {
        var matchTypes = ["exact", "last name", "last name/first name initial", "last name and first name"]
        console.log("found fuzzy match at name1:'" + name1 + "' name2:'" + name2 + "' - matched: " + matchTypes[result]);
    }

    return (result > 0) ? result : -1;
};

var findByName = function (rankings, name) {
    //		console.log("findByName firing callback...");

    // use a fuzzy search to match up names so we can normalize
    // Freddie vs. Fredrik, etc.
    // returns exactly a result or null if no match

    var lastMatch = -1;
    var lastMatchIndex = -1;

    if (rankings.length == 0) console.log("Golfer rankings didn't load!");

    var result = null;
    for (var i = 0; i < rankings.length; i++) {

        var match = fuzzyMatch(name, rankings[i].name);
        if (match == 0) {
            lastMatch = 0;
            lastMatchIndex = i;
            //				console.log("Found an exact match!");
            break; // return on a perfect match
        } else {
            // remember the last match, see if this is better
            if (match == 1) {
                // last name was the only match... this isn't good enough to keep
                match = -1;
            }

            if (match > lastMatch) {
                lastMatchIndex = i;
            } else if (match >= 0 && match == lastMatch) {
                //					console.log("Found an equal match!");
            }
        }
    }

    // if we get all the way through with no perfect match,
    // return the best "fuzzy" match
    if (lastMatchIndex >= 0) {
        result = rankings[lastMatchIndex];
    }

    return result;
};

var addPlayerRankings = function (eventdata, rankings) {
    // add the ranking data to the event information
    var len = eventdata.scores.length;

    for (var i = 0; i < len; i++) {
        var name = eventdata.scores[i].name;
        var score = eventdata.scores[i];

        var data = findByName(rankings, name);

        // add player rank and unique id to our event data
        if (data != null) {
            score.rank = data.rank;
            score.player_id = data.player_id;
        } else {
            console.log("Couldn't find player " + name);
            score.rank = "-";
            score.player_id = NameUtils.normalize(name);
        }
    }
};

exports.get = function (eventid, event, course, callbacks) {

    var theDate = new Date(event.start);
    var year = theDate.getFullYear();
    var provider = event.provider;

    //
    // [06/11/2019] djb - moved all tournament and ranking data to a 
    //                    separate service.  source is here:
    //                    https://github.com/djboulia/tourdata
    //                    simplifies this code such that we only support
    //                    one data provider
    //
    if (provider === "tourdata") {

        var tournament_id = event.tournament_id;
        var tourData = new TourData(year);

        tourData.getRankings()
            .then(rankings => {
                tourData.getEvent(tournament_id)
                    .then(tournament => {
                        addPlayerRankings(tournament, rankings);

                        if (callbacks && callbacks.success) {
                            callbacks.success(tournament);
                        }
                    })
                    .catch((e) => {
                        console.log("Error retrieving event data!");

                        if (callbacks && callbacks.error) {
                            callbacks.error(e);
                        }
                    });
            })
            .catch((e) => {
                console.log("Error retrieving ranking data!");

                if (callbacks && callbacks.error) {
                    callbacks.error(e);
                }
            });

    } else {
        console.log("ERROR: unsupported data provider " + provider);
    }

};