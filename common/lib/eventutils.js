const EventUtils = function () {
    const copy = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // 
    // return an array of course information (course name, par, etc.) for
    // each round in the tournament.
    //
    // courses :[ { "name": "Royal Aberdeen", "par": "70" }
    //
    this.courses = function (event) {

        var list = [];

        // console.log('event.rounds ', event.rounds);

        for (let i = 0; i < event.rounds.length; i++) {
            var round = copy(event.rounds[i]);


            round.course.date = round.date;

            // console.log(round);

            list.push(round.course);
        }

        // console.debug("eventUtils.courses:" + JSON.stringify(list));

        return list;
    };

    // [07/29/2016] had to change this based on the way the back end data for
    //              live scoring is now reported. We use the "thru" key to
    //              determine if anyone is mid way through a round
    //
    // identify rounds that have not yet started.  This will allow
    // us to carry over prior day totals for players that haven't teed off yet
    //
    // as input, we expect an array of golfers (see golfers method below)
    // 
    this.roundStatus = function (golfers, numberOfRounds) {
        var ROUND_STARTED = 1;
        var ROUND_NOT_STARTED = 0;

        var statusData = [];
        var i;

        for (i = 0; i < numberOfRounds; i++) {
            statusData.push(ROUND_NOT_STARTED);
        }

        var self = this;

        golfers.forEach(function (golfer) {
            for (i = 0; i < numberOfRounds; i++) {
                var round = i + 1;

                round = round.toString();

                if (self.isValidScore(golfer[round])) {
                    // console.debug("found valid score for round " + round + ", golfer " +
                    //     JSON.stringify(golfer));
                    statusData[i] = ROUND_STARTED;

                } else {
                    // no valid score, but see if there is an in progress round
                    var thru = golfer['thru'];
                    // console.debug("golfer " + golfer['name'] + " thru: " + thru);

                    if (self.isNumber(thru) && thru < 18) {
                        // console.debug("found in progress score for round " + round + ", golfer " +
                        //     JSON.stringify(golfer) + " thru " + thru);
                        statusData[i] = ROUND_STARTED;
                    }

                    // short circuit the loop here... last valid score
                    break;
                }
            }

        });

        return statusData;
    };

    this.lastRoundPlayed = function (roundStatus) {
        var roundPlayed = -1;

        for (var i = 0; i < roundStatus.length; i++) {
            if (roundStatus[i]) {
                roundPlayed = i;
            } else {
                break;
            }
        }

        return roundPlayed;
    };

    this.getRoundNetScore = function (golfer, par, roundNumber, roundStatus) {
        // find the net score for the given round. if the round we're looking for is the last played round, 
        // we can use the "today" score since it represents the most recent score.  This will
        // allow us to display a meaningful "lowest" score relative to par when a round
        // is in progress
        //
        // if the round isn't the most recent, then just use the completed round net score to par
        //
        var lastRoundPlayed = this.lastRoundPlayed(roundStatus);
        var useToday = (lastRoundPlayed == roundNumber) ? true : false;

        // console.log(`useToday ${useToday}, par ${par}, roundNumber ${roundNumber}`);
        // console.log(`golfer.name ${golfer.name} golfer.today ${golfer.today}, golfer[roundNumber +1] - par ${golfer[roundNumber +1] - par}`);

        // console.log('getRoundNetScore: ', golfer, par, roundNumber, roundStatus);
        return (useToday) ? this.parseNetScore(golfer.today) : this.formatNetScore(golfer[roundNumber + 1] - par);
    };

    /**
     * 
     * find low net total score for the given round
     * uses golfer.total which should be in net score format (e.g. -1, E, +1)
     *
     * returns an integer value representing lowest score or NaN if there are no scores
     */
    this.lowRoundNetTotal = function (golfers, par, roundNumber, roundStatus) {
        let lowScore = NaN;

        for (let i = 0; i < golfers.length; i++) {
            const golfer = golfers[i];

            // djb [09/03/2022] instead of taking the first entry as the initial
            //                  low score, we instead keep going until we find a
            //                  valid initial score. this fixes a bug where the 
            //                  first golfer's score isn't valid (e.g. he was cut 
            //                  or didn't finish the round.)
            if (!this.isNumber(lowScore)) {
                lowScore = this.getRoundNetScore(golfer, par, roundNumber, roundStatus);
            } else {
                const netScore = this.getRoundNetScore(golfer, par, roundNumber, roundStatus);

                if (this.parseNetScore(netScore) < this.parseNetScore(lowScore)) {
                    lowScore = netScore;
                }
            }
        }

        return lowScore;
    };

    // 
    // returns an array of leaders for a given round
    //
    this.singleRoundLeaders = function (golfers, courseInfo, roundNumber, roundStatus) {
        var leaders = [];
        var par = courseInfo[roundNumber].par;
        var lowScore = this.lowRoundNetTotal(golfers, par, roundNumber, roundStatus);

        console.log("round " + roundNumber + " low score " + lowScore);

        // build a list of the leaders
        for (var i = 0; i < golfers.length; i++) {
            var golfer = golfers[i];
            var netScore = this.getRoundNetScore(golfer, par, roundNumber, roundStatus);

            if (netScore == lowScore) {
                leaders.push({
                    name: golfer.name,
                    score: netScore
                });

                console.debug("adding " + golfer.name + " for round " + roundNumber + " with score: " + netScore);
            }
        }

        return leaders;
    };

    //
    // returns an array of arrays of golfer records that represent each round
    // index of the top level array indicates the leaders for each round
    // the sub array is the list of leaders for that round
    // 
    // returns an array or arrays with the leaders of each round
    //
    this.roundLeaders = function (golfers, courseInfo) {
        // console.log('RoundLeaders golfers: ', golfers);
        // console.log('RoundLeaders courseInfo: ', courseInfo);

        var numberOfRounds = courseInfo.length;
        var roundStatus = this.roundStatus(golfers, numberOfRounds);
        var leaders = [];

        console.log("Rounds started: " + JSON.stringify(roundStatus));

        for (var i = 0; i < roundStatus.length; i++) {
            if (roundStatus[i]) {
                // for the rounds that have started, go get the leaders   
                console.log("getting single round leaders for round " + i);
                leaders.push(this.singleRoundLeaders(golfers, courseInfo, i, roundStatus));
            } else {
                // round not started, just put an empty array of leaders
                leaders.push([]);
            }
        }

        return leaders;
    };

    //
    // find low net total score for the tournament
    // uses golfer.total which should be in net score format (e.g. -1, E, +1)
    //
    // returns an integer value representing lowest score or NaN if there are no scores
    //
    this.lowNetTotal = function (golfers) {
        var lowScore = NaN;

        // find lowest score
        for (var i = 0; i < golfers.length; i++) {
            var golfer = golfers[i];

            if (i == 0) {
                lowScore = this.parseNetScore(golfer.total);
            } else {
                if (this.parseNetScore(golfer.total) < lowScore) {
                    lowScore = this.parseNetScore(golfer.total);
                }
            }
        }

        return lowScore;
    };

    // 
    // build a list of golfers leading the tournament
    //
    this.tournamentLeaders = function (golfers) {

        var leaders = [];
        var lowScore = this.lowNetTotal(golfers);

        // build a list of the leaders
        for (var i = 0; i < golfers.length; i++) {
            var golfer = golfers[i];

            if (golfer.total == lowScore) {
                leaders.push(copy(golfer));

                //    eventUtils.formatNetScore(netScore));
                console.debug("adding " + golfer.name + " score: " + golfer.total);
            }
        }

        return leaders;
    };


    //
    // returns the current round in progress
    // returns 0 if no rounds have started
    //
    this.getCurrentRoundInProgress = function (golfers, numberOfRounds) {
        var roundStatus = this.roundStatus(golfers, numberOfRounds);

        console.debug("Rounds started: " + JSON.stringify(roundStatus));

        // find most recently played round, walking backwards
        var currentRound = 0;

        for (var i = roundStatus.length - 1; i >= 0; i--) {
            if (roundStatus[i]) {
                currentRound = i + 1;
                break;
            }
        }

        return currentRound;
    };

    this.formatNetScore = function (score) {
        // pretty print the score with zero represented as "even"
        // and above par scores with a leading + sign
        if (score == 0) return "E";

        if (score > 0) return "+" + score;

        return String(score);
    };

    this.isValidScore = function (score) {
        // if it has anything but digits, that's bad
        if (String(score).search(/^\s*\d+\s*$/) != -1) {
            return true;
        }

        return false;
    };

    this.parseNetScore = function (score) {
        // parse a score in net format, e.g. -3, E, +1
        // returns NaN if the score isn't valid

        if (typeof score === 'string' || score instanceof String) {
            // look for special case of "even" par as "E"
            if (score.toUpperCase() == "E") {
                return 0;
            }

        }

        return parseInt(score);
    };

    this.isValidNetScore = function (score) {
        return !isNaN(this.parseNetScore(score));
    };

    this.isNumber = function (str) {
        var result = parseInt(str);
        return !isNaN(result);
    };

    // [07/29/2016] had to change this based on the way the back end data for
    //              live scoring is now reported. We use the "thru" key to
    //              determine if anyone is mid way through a round
    //
    // identify rounds that have not yet started.  This will allow
    // us to carry over prior day totals for players that haven't teed off yet
    //
    // as input, we expect an array of golfers (see golfers method below)
    // 
    this.roundStatus = function (golfers, numberOfRounds) {
        var ROUND_STARTED = 1;
        var ROUND_NOT_STARTED = 0;

        var statusData = [];
        var i;

        for (i = 0; i < numberOfRounds; i++) {
            statusData.push(ROUND_NOT_STARTED);
        }

        var self = this;

        golfers.forEach(function (golfer) {
            for (i = 0; i < numberOfRounds; i++) {
                var round = i + 1;

                round = round.toString();

                if (self.isValidScore(golfer[round])) {
                    // console.debug("found valid score for round " + round + ", golfer " +
                    //     JSON.stringify(golfer));
                    statusData[i] = ROUND_STARTED;

                } else {
                    // no valid score, but see if there is an in progress round
                    var thru = golfer['thru'];
                    // console.debug("golfer " + golfer['name'] + " thru: " + thru);

                    if (self.isNumber(thru) && thru < 18) {
                        // console.debug("found in progress score for round " + round + ", golfer " +
                        //     JSON.stringify(golfer) + " thru " + thru);
                        statusData[i] = ROUND_STARTED;
                    }

                    // short circuit the loop here... last valid score
                    break;
                }
            }

        });

        return statusData;
    };

    // 
    // This is only used in NON PGA events with net (handicapped) players
    //
    // we want to create a data structure which flattens the rounds to look like
    // the following:
    // players :[ { "player_id": "Tiger Woods", "1": 80, "2", 72, "3", 79 ... }
    //
    //
    this.golfers = function (event) {
        // put all of our players into a hash map
        var golfers = [];
        var i, j, k;

        for (i = 0; i < event.players.length; i++) {
            var golfer = event.players[i];
            var player_id = golfer.user._id;

            golfers.push({
                player_id: player_id,
                name: golfer.user.name,
                rank: golfer.handicap // use handicap to rank players in non PGA events
            });
        }

        for (i = 0; i < event.rounds.length; i++) {
            var round = event.rounds[i];

            for (j = 0; j < round.scores.length; j++) {
                var score = round.scores[j];

                // match up this score with the appropriate player
                for (k = 0; k < golfers.length; k++) {

                    if (golfers[k].player_id == score.player) {
                        var roundNumber = i + 1;

                        golfers[k][roundNumber.toString()] = score.score;
                    }
                }
            }
        }

        // calculate current tournament totals for each player
        var currentRound = -1;
        var roundStatus = this.roundStatus(golfers, event.rounds.length);

        for (i = roundStatus.length - 1; i >= 0; i--) {
            if (roundStatus[i]) {
                currentRound = i;
                break;
            }
        }

        if (currentRound >= 0) {

            for (i = 0; i < golfers.length; i++) {
                var golfer = golfers[i];

                // sum up the scoring thus far
                golfer.total = 0;

                for (j = 0; j <= currentRound; j++) {
                    var roundNumber = new String(j + 1);

                    golfer.total += parseInt(golfer[roundNumber]);
                }
            }
        }

        return golfers;
    };

    this.getCurrentRound = function(courseInfo) {
        // courseInfo is an array of courses for each round of the
        // tournament.  each course has a date when that round will
        // be played.
        //
        // figure out the current round based on today's date
        // we do this to display the right course information.
        // each day's course could be different
    
        let currentCourse = courseInfo[0];
        let currentRound = 1;
        const now = Date.now();
        let i;
    
        console.debug("eventUtils.getCurrentRound: courseInfo " + JSON.stringify(courseInfo));
    
        for (i = 1; i < courseInfo.length; i++) {
            var course = courseInfo[i];
    
            var delta1 = Date.parse(currentCourse.date) - now;
            var delta2 = Date.parse(course.date) - now;
    
            console.debug("eventUtils.getCurrentRound: delta1 " + delta1 + ", delta2 " + delta2);
    
            if ((delta2 <= 0) && (Math.abs(delta2) < Math.abs(delta1))) {
                currentCourse = course;
                currentRound = i + 1; // first round starts at 1
            }
        }
    
        return currentRound;
    }

    this.getRoundTitles = function(courseinfo, text) {
        // build an array of titles for each round
        // the resulting array will consist of the supplied text plus
        // the round number (1, 2, 3, etc.)
        var roundTitles = [];
        var i;
    
        if (!text) {
            text = "";
        } else {
            text += " ";
        }
    
        for (i = 0; i < courseinfo.length; i++) {
            var roundNumber = i + 1;
    
            roundTitles.push(text + roundNumber.toString());
        }
    
        return roundTitles;
    }
};

module.exports = EventUtils;