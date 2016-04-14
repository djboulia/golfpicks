angular.module('GolfPicks')
    .controller('EventLeadersCtrl', ['$scope', '$stateParams', '$location',
                                     'gameData', 'gameUtils', 'cloudDataEvent', 'eventUtils', EventLeadersCtrl]);


function EventLeadersCtrl($scope, $stateParams, $location, gameData, gameUtils, cloudDataEvent, eventUtils) {

    //
    // pos is a string either with the golfer's place in the tournament (1,2,3) or their
    // status if they are no longer in the tournament: CUT, WD, DNS
    //
    var comparePosition = function(a, b) {
        
        if (a==b){
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

    $scope.courseUrl = "coursedetails";

    $scope.loadItems = function () {

        $scope.statusMessage = "Loading...";

        // if testingMode is a url parameter, turn off some of the date/rule checking
        var testingMode = $location.search().testingMode ? true : false;
        console.log("testingMode is set to " + testingMode);

        // if debugMode is a url parameter, write more info to the log
        var debugMode = $location.search().debugMode ? true : false;

        // called when we've loaded initial game data
        var eventLoadedHandler = function (eventid) {

            // load the current event associated with this game
            // the EVENT holds the golfers
            // the GAME is the game played based on the golfer's scores

            gameData.loadEvent(eventid, {
                success: function (event, golfers, courseInfo) {
                    var roundStatus = eventUtils.roundStatus(golfers, event.rounds.length);
                    var roundNumbers = [];
                    var lowRounds = [];

                    for (var i = 0; i < courseInfo.length; i++) {
                        roundNumbers.push(String(i + 1));
                        lowRounds[String(i + 1)] = "-";
                    }

                    // find last played round, walking backwards
                    var currentRound = -1;

                    for (var i = roundStatus.length - 1; i >= 0; i--) {
                        if (roundStatus[i]) {
                            currentRound = i;
                            break;
                        }
                    }

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
                                    return a[roundNumber] - b[roundNumber];
                                });

                                // first element is low score
                                lowRounds[roundNumber] = golfers[0][roundNumber];
                            }

                        }

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

                    $scope.name = event.name;
                    $scope.courseInfo = courseInfo;
                    $scope.golfers = golfers;
                    $scope.roundNumbers = roundNumbers;
                    $scope.lowRounds = lowRounds;
                    $scope.eventOverviewUrl = "#/eventdetails/id/" + eventid;

                    $scope.loaded = true;

                },
                error: function (err) {
                    // The object was not retrieved successfully.
                    console.error("Couldn't access event information!");

                    $scope.$apply(function () {
                        $scope.errorMessage = "Couldn't access event information!";
                    });
                }
            });
        }

        var eventid = $stateParams.id;

        if (eventid) {
            eventLoadedHandler(eventid);
        } else {
            console.log("error! no eventid specified!");
            $scope.errorMessage = "error! no eventid specified!";
        }

    }

    $scope.onRefresh = function () {
        console.log("Refreshing event leaders");

        // Go back to the Cloud and load a new set of Objects 
        // as a hard refresh has been done
        $scope.loadItems();

        // set the timeout interval to refresh every 5 minutes
        var REFRESH_MINUTES = 5;

        setTimeout($scope.onRefresh, REFRESH_MINUTES * 1000 * 60);
    };

    $scope.onRefresh();
};