/**
 * Connect to our data source, extend the model if necessary
 * and expose API end points for this model.
 *
 */

const scores = require('../common/lib/scores.js');
const TourData = require('../common/lib/pgascores/tourdata');
const EventUtils = require('../common/lib/eventutils.js');
const app = require('@apiserver/modelserver');

const Event = function (model) {
    const eventUtils = new EventUtils();

    model.scores = async function (id) {
        console.log("getting scores for event " + id);

        const Course = app.getModel('Course');

        const eventrecord = await model.findById(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            })

        console.log("called showScore for id " + id);

        var event = eventrecord;
        var courseid;

        if (event.rounds && event.rounds.length > 0) {
            // use the first day's course as the course for all rounds
            courseid = event.rounds[0].course;
        } else {
            var str = "Invalid event object. No round info found!";

            console.error(str);
            throw new Error(str);
        }

        console.log("finding course " + courseid);

        // find the course information
        const courserecord = await Course.findById(courseid)
            .catch((err) => {
                console.error("Error!" + JSON.stringify(err) + " courserecord " + courserecord);
                throw new Error(err);
            })

        // call the scoring service
        const result = await scores.get(event)
            .catch((e) => {
                console.error("Error!" + JSON.stringify(err));
                throw new Error(err);
            })

        return result;
    }

    model.weather = async function (id) {
        console.log("getting weather for event " + id);

        const Course = app.getModel('Course');

        const eventrecord = await model.findById(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            });

        console.log("found id " + id);

        const event = eventrecord;
        var courseid;

        if (event.rounds && event.rounds.length > 0) {
            // use the first day's course as the course for all rounds
            courseid = event.rounds[0].course;
        } else {
            const str = "Invalid event object. No round info found!";

            console.error(str);
            throw new Error(str);
        }

        console.log("finding course " + courseid);

        // find the course information
        const result = await Course.weather(courseid)
            .catch((e) => {
                const str = "No location info for course " + courseid;
                console.error(str);
                throw new Error(str);
            })

        return result;
    }

    const getPlayers = async function (event) {

        // in a non-PGA round, the golfer ids and scores
        // will be contained directly in this object.  For PGA rounds
        // the scoring data is loaded separately from the official tour site
        console.log("Scoring format is : " + event.scoreType);

        if (event.scoreType == "pga-live-scoring") {
            console.log("PGA round, not loading golfer data");

            // return immediately since we aren't loading golfer data
            return event.players;
        } else {
            console.log("non PGA round, loading golfer data");

            var players = JSON.parse(JSON.stringify(event.players));
            var ids = [];

            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                ids.push(player.user);
            }

            const Gamer = app.getModel('Gamer');

            const objs = await Gamer.findByIds(ids)
                .catch((e) => {
                    const str = "Couldn't get player list " + JSON.stringify(ids);
                    console.error(str);
                    throw new Error(str);
                })

            // fluff up the players object with player data
            var playermap = {};

            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                playermap[obj.id] = obj;
            }

            var validplayers = [];

            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                var playerdetails = playermap[player.user];

                if (playerdetails) {
                    player.user = playerdetails;
                    validplayers.push(player);
                } else {
                    console.log("couldn't find id " + player.user);
                    console.log("roundmap: " + JSON.stringify(playermap));
                }
            }

            console.log("setting players " + JSON.stringify(validplayers));

            return validplayers;
        };
    };

    const getRounds = async function (event) {

        var rounds = JSON.parse(JSON.stringify(event.rounds));
        var ids = [];
        for (var i = 0; i < rounds.length; i++) {
            var round = rounds[i];
            ids.push(round.course);
        }

        const Course = app.getModel('Course');

        const objs = await Course.findByIds(ids)
            .catch((e) => {
                const str = "Couldn't get course list " + JSON.stringify(ids);
                console.error(str);
                throw new Error(str);
            })

        // fluff up the rounds object with course data
        const roundmap = {};

        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            roundmap[obj.id] = obj;
        }

        const validrounds = [];

        for (let i = 0; i < rounds.length; i++) {
            const round = rounds[i];
            const coursedetails = roundmap[round.course];

            if (coursedetails) {
                round.course = coursedetails;
                validrounds.push(round);
            } else {
                console.log("couldn't find id " + round.course);
                console.log("roundmap: " + JSON.stringify(roundmap));
            }
        }

        return validrounds;
    };

    const sortByRank = function (records) {

        records.sort(function (a, b) {
            // djb [09/04/2022] handles ties in rankings
            var aRank = (a.rank.startsWith('T')) ? a.rank.substr(1) : a.rank;
            var bRank = (b.rank.startsWith('T')) ? b.rank.substr(1) : b.rank;

            // if unranked supply a sufficiently high numbrer
            aRank = (aRank == "-") ? 1000 : aRank;
            bRank = (bRank == "-") ? 1000 : bRank;

            return aRank - bRank
        });

        return records;
    };


    /**
     * Do a deep get for this event where we fill in player and
     * course information
     *
     * @param {String} id event id
     * @param {String} playerSort optional - valid values: ranking
     * @returns
     */
    model.deepGet = async function (id, playerSort) {

        // default sort is by tournament position.  if playerSort is
        // equal to 'ranking', we will sort based on world golf ranking
        // for the players in the field
        const sortByRanking = (playerSort && playerSort.toLowerCase() === 'ranking') ? true : false;
        console.log('sortByRanking = ', sortByRanking);

        const eventrecord = await model.findById(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            });

        console.log("found id " + id);

        const event = eventrecord;

        // do a deep get for player info
        event.players = await getPlayers(event)
            .catch((e) => {
                throw new Error(e);
            });

        // do a deep get for course info
        event.rounds = await getRounds(event)
            .catch((e) => {
                throw new Error(e);
            });

        const courseInfo = eventUtils.courses(event);

        // console.debug("entering loadEventData courseInfo :" + JSON.stringify(courseInfo));

        console.log("scoreType = " + event.scoreType);

        // There are multiple types of scoring systems
        // For non PGA events, the scores are contained directly in
        // the event record.  For PGA events, we need to load the
        // live scoring data from the tour site

        if (event.scoreType == "pga-live-scoring") {

            // go get the golfer scores from the remote service
            const tournament = await model.scores(id)
                .catch((e) => {
                    var str = "Could not get scores for event id " + id;
                    console.error(str);
                    throw new Error(str);
                });

            // console.debug("loadEventData courseInfo :" + JSON.stringify(courseInfo));

            event.golfers = tournament.scores;
            event.courseInfo = courseInfo;

            if (sortByRanking) {
                sortByRank(event.golfers);

                for (var i = 0; i < event.golfers.length; i++) {
                    event.golfers[i].index = i + 1;
                }
            }

        } else {
            // match up scores and players
            const golfers = eventUtils.golfers(event);

            event.golfers = golfers;
            event.courseInfo = courseInfo;
        }

        return event;
    };

    /**
     * Return a newsfeed for this event. Consists of the tournament leader
     * and any current round leaders
     *
     * @param {String} id event id
     * @returns
     */
    model.newsfeed = async function (id) {

        const event = await model.deepGet(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            });

        const golfers = event.golfers;
        const courseInfo = event.courseInfo;

        console.log("found event id " + id);

        var feedItems = [];
        var currentRound = eventUtils.getCurrentRoundInProgress(golfers, event.rounds.length);

        if (currentRound > 0) {

            // var totalPar = 0;

            // for (var i = 0; i < currentRound; i++) {
            //     totalPar += courseInfo[i].par;
            // }

            // console.debug("total par: " + totalPar + ", currentRound: " + currentRound);
            // console.debug(JSON.stringify(golfers));

            if (event.scoreType == "pga-live-scoring") {
                // First entry is the tournament leader; return this and all ties
                //                                    var score = golfers[0].strokes;
                //                                    var netScore = score - totalPar;

                var leaders = eventUtils.tournamentLeaders(golfers);
                var text = (leaders.length > 1) ? "Tournament leaders" : "Tournament leader";

                feedItems.push(text);

                for (var i = 0; i < leaders.length; i++) {
                    var leader = leaders[i];

                    feedItems.push(leader.name + " " + leader.total);
                }

                var roundLeaders = eventUtils.roundLeaders(golfers, courseInfo);
                console.log("roundLeaders: " + JSON.stringify(roundLeaders));

                if (roundLeaders[currentRound - 1].length > 0) {
                    var leaders = roundLeaders[currentRound - 1];

                    var text = "Day " + currentRound + " low scores";

                    feedItems.push(text);

                    for (var i = 0; i < leaders.length; i++) {
                        var leader = leaders[i];

                        feedItems.push(leader.name + " " + leader.score);
                    }
                }
            };
        }

        return feedItems;
    };

    //
    // pos is a string either with the golfer's place in the tournament (1,2,3) or their
    // status if they are no longer in the tournament: CUT, WD, DNS
    //
    var comparePosition = function (a, b) {

        if (a == b) {
            return 0;
        }

        // position will start with a T for any ties - remove that
        if (a.slice(0, 1) == "T") {
            a = a.slice(1);
        }

        if (b.slice(0, 1) == "T") {
            b = b.slice(1);
        }

        if (eventUtils.isValidScore(a) && eventUtils.isValidScore(b)) {
            return parseInt(a) - parseInt(b);
        } else if (eventUtils.isValidScore(a)) {
            return -1;
        } else if (eventUtils.isValidScore(b)) {
            return 1;
        } else {
            // neither are numbers, so compare strings

            // DNS = Did Not Start... always sort these to the bottom
            if (a == "DNS") {
                return 1;
            } else if (b == "DNS") {
                return -1;
            }

            // last resort, just compare strings
            return a.localeCompare(b);
        }
    };

    /**
     * Return a sorted list of golfers for this event ordered
     * from the first to last.
     *
     * @param {String} id event id
     * @returns
     */
    model.leaders = async function (id) {

        const event = await model.deepGet(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            });

        const golfers = event.golfers;
        const courseInfo = event.courseInfo;

        console.log("found event id " + id);

        var roundStatus = eventUtils.roundStatus(golfers, event.rounds.length);
        var roundNumbers = [];
        var lowRounds = [];

        for (var i = 0; i < courseInfo.length; i++) {
            roundNumbers.push(String(i + 1));
            lowRounds[String(i + 1)] = "-";
        }

        console.log("roundStatus = " + JSON.stringify(roundStatus, null, 2));

        // find last played round, walking backwards
        var currentRound = -1;

        for (var i = roundStatus.length - 1; i >= 0; i--) {
            if (roundStatus[i]) {
                currentRound = i;
                break;
            }
        }

        //                        console.log("current round = " + currentRound);
        //                        console.log("golfers before = " + JSON.stringify(golfers, null, 2));

        if (currentRound >= 0) {

            // store low score for each round of the tournament
            var leaders = eventUtils.roundLeaders(golfers, courseInfo);

            for (var i = 0; i <= currentRound; i++) {
                var roundNumber = new String(i + 1);

                if (i == currentRound) {
                    lowRounds[roundNumber] = (leaders[i][0]) ? leaders[i][0].score : '-';

                    // loop through the current day scores and convert to net par
                    // this makes in progress rounds format more nicely

                    for (var g = 0; g < golfers.length; g++) {
                        var golfer = golfers[g];

                        if (golfer["today"] != '-') {
                            golfer[roundNumber] = golfer["today"];
                        }
                    }
                } else {

                    // sort lowest round total
                    golfers.sort(function (a, b) {
                        var aScore = a[roundNumber];
                        var bScore = b[roundNumber];

                        if (isNaN(aScore)) {
                            return 1;
                        } else if (isNaN(bScore)) {
                            return -1;
                        }

                        return aScore - bScore;
                    });

                    // first element is low score
                    lowRounds[roundNumber] = golfers[0][roundNumber];
                }

            }

            //                            console.log("golfers after = " + JSON.stringify(golfers, null, 2));

            var roundNumber = new String(currentRound + 1);

            // TODO: fix for non PGA case
            // modify totals to be relative to par
            var isPGA = true;
            if (!isPGA) {
                // find lowest totals
                golfers.sort(function (a, b) {
                    if (a.total == b.total) {
                        return 0;
                    } else if (a.total == '-') {
                        return 1;
                    } else if (b.total == '-') {
                        return -1;
                    } else {
                        return a.strokes - b.strokes;
                    }
                });

                var totalPar = 0;

                for (var i = 0; i <= currentRound; i++) {
                    totalPar += courseInfo[i].par;
                }

                for (var i = 0; i < golfers.length; i++) {
                    var golfer = golfers[i];

                    golfer.total = eventUtils.formatNetScore(golfer.total - totalPar);
                }
            } else {

                console.debug("Golfers: " + JSON.stringify(golfers));

                // sort by position
                golfers.sort(function (a, b) {
                    return comparePosition(a.pos, b.pos);
                });


                //                            golfers.sort(function (a, b) {
                //                                var aTotal = eventUtils.parseNetScore(a.total);
                //                                var bTotal = eventUtils.parseNetScore(b.total);
                //
                //                                if (aTotal == bTotal) {
                //                                    return 0;
                //                                } else if (!eventUtils.isValidNetScore(a.total)) {
                //                                    return 1;
                //                                } else if (!eventUtils.isValidNetScore(b.total)) {
                //                                    return -1;
                //                                } else {
                //                                    return aTotal - bTotal;
                //                                }
                //                            });
            }
        }

        return {
            name: event.name,
            courseInfo: courseInfo,
            golfers: golfers,
            roundNumbers: roundNumbers,
            lowRounds: lowRounds
        };
    };

    model.tourSchedule = async function(year) {
        console.log('found year ', year);
        const tourData = new TourData(year);
        const result = await tourData.getSchedule();

        const schedule = result.schedule;

        // console.log('found schedule', schedule);

        const events = [];

        for (let i=0; i<schedule.length; i++) {
            const event = schedule[i];

            console.log(' found event ', event);

            // should be in the format /{year}/tour/pga/event/{id}
            const hrefParts = event.link.href.split('/');

            events.push({
                name: event.tournament,
                start: event.startDate,
                end : event.endDate,
                courses : event.courses,
                provider: 'tourData',
                year : hrefParts[1],
                tournament_id: hrefParts[5]
            });
        }

        return events;
    }

    // expose the create, read, update methods from this model
    model.addCrudMethods();

    // add any additional entry points here
    model.method(
        '/:id/scores',
        'GET',
        {
            description: "Get scores for this event",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ]
        },
        model.scores
    );

    model.method(
        '/:id/weather',
        'GET',
        {
            description: "Get current weather for this event",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ]
        },
        model.weather
    );

    model.method(
        '/:id/deep',
        'GET',
        {
            description: "Perform a deep get for this event",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
                {
                    name: 'playerSort',
                    source: 'query',
                    type: 'string',
                    optional: true
                },
            ]
        },
        model.deepGet
    );

    model.method(
        '/:id/newsfeed',
        'GET',
        {
            description: "Get the news feed (round leaders, event leaders) for this event",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ]
        },
        model.newsfeed
    );

    model.method(
        '/:id/leaders',
        'GET',
        {
            description: "Get the golfers for this event, sorted by score",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ]
        },
        model.leaders
    );

    model.method(
        '/tour/pga/:year',
        'GET',
        {
            description: "Get the PGA tour schedule for this year",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'year',
                    source: 'param',
                    type: 'number'
                },
            ]
        },
        model.tourSchedule
    );
}

module.exports = Event;