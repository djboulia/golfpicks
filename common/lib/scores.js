var pgaProvider = require('./pgascores/pgatourprovider.js');
var yahooProvider = require('./pgascores/pgatourprovider.js');
var golfChannelProvider = require('./pgascores/golfchannelprovider.js');
var NameUtils = require('./pgascores/nameutils.js');
var cacheModule = require('./cache.js');

var worldRankingsCache = new cacheModule.Cache(60 * 60 * 24); // 24 hrs in seconds
var eventCache = new cacheModule.Cache(60 * 5); // 5 mins

var worldRankings = function (year, callbacks) {

    var rankings = worldRankingsCache.get(year);

    if (rankings) {
        if (callbacks && callbacks.success) {
            callbacks.success(rankings);
        }
    } else {
        // get the current world rankings
        pgaProvider.getRankings(year, function (rankings) {
            if (rankings) {
                if (callbacks && callbacks.success) {
                    // cache for next time
                    worldRankingsCache.put(year, rankings);

                    callbacks.success(rankings);
                }
            } else {
                if (callbacks && callbacks.error) {
                    callbacks.error("Error getting world rankings!");
                }
            }
        });
    }
};

//
// pick up common abbreviations for first names
// e.g. Alex is an abbreviation of Alexander
//
var sameFirstName = function( firstName1, firstName2 ) {
    var names = {
        'alexander' : ["alex"],
        'soren' : ["søren"],
        'william' : ["bill", "billy", "will", "willy"]
    };

    // do the simple check first
    if (firstName1 == firstName2) {
        return true;
    }

    var key;
    for (key in names) {

        var nicknames = names[key];

        if (key==firstName1) {

            for (var i=0; i<nicknames.length; i++) {
                if (nicknames[i] == firstName2) {
                    return true;
                }
            }
        } else if (key==firstName2) {

            for (var i=0; i<nicknames.length; i++) {
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
		console.log( "found fuzzy match at name1:'" + name1 + "' name2:'" + name2 + "' - matched: " + matchTypes[result]);
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

    console.log("getting world rankings for " + year);

    worldRankings(year, {
        success: function (rankings) {

            var tournament = eventCache.get(eventid);

            if (tournament) {
                if (callbacks && callbacks.success) {
                    callbacks.success(tournament);
                }
            } else {
                var provider = event.provider;

                // use the appropriate tour data provider
                if (provider === "pga") {
                    pgaProvider.getEvent(event, course, function (tournament) {

                        //                    console.log("tournament: " + JSON.stringify(tournament));
                        if (!tournament) {
                            if (callbacks && callbacks.error) {
                                callbacks.error("Couldn't get PGA event information!");
                            }
                        } else {
                            addPlayerRankings(tournament, rankings);

                            eventCache.put(eventid, tournament);

                            if (callbacks && callbacks.success) {
                                callbacks.success(tournament);
                            }
                        }
                    });

                } else if (provider === "golfchannel") {
                    console.log("Using Golf Channel provider");

                    golfChannelProvider.getEvent(event, course, function (tournament) {

                        //                    console.log("tournament: " + JSON.stringify(tournament));
                        if (!tournament) {
                            if (callbacks && callbacks.error) {
                                callbacks.error("Couldn't get PGA event information!");
                            }
                        } else {
                            addPlayerRankings(tournament, rankings);

                            eventCache.put(eventid, tournament);

                            if (callbacks && callbacks.success) {
                                callbacks.success(tournament);
                            }
                        }
                    });

                } else {
                    var str = "Error: invalid provider " + provider + " found!"

                    console.log(str);
                    if (callbacks && callbacks.error) {
                        callbacks.error(str);
                    }
                }
            }
        },
        error: function (err) {
            if (callbacks && callbacks.error) {
                callbacks.error(err);
            }
        }
    });

};
