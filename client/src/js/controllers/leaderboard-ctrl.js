angular.module('GolfPicks')
    .controller('LeaderboardCtrl', ['$scope', '$stateParams', '$location',
                                    'gameData', 'gameUtils', 'eventUtils',
                                    'weatherData', LeaderboardCtrl]);


function LeaderboardCtrl($scope, $stateParams, $location, gameData, gameUtils, eventUtils, weatherData) {
    var gameid = $stateParams.id;

    $scope.courseUrl = "coursedetails";

    $scope.loadItems = function () {

        $scope.statusMessage = "Loading...";

        // if testingMode is a url parameter, turn off some of the date/rule checking
        var testingMode = $location.search().testingMode ? true : false;
        console.log("testingMode is set to " + testingMode);

        // if debugMode is a url parameter, write more info to the log
        var debugMode = $location.search().debugMode ? true : false;

        var hasNotStarted = function (gameDetails) {
            var start = gameDetails.start;
            var end = gameDetails.end;

            if (!gameUtils.tournamentInProgress(start, end) &&
                !gameUtils.tournamentComplete(start, end)) {

                return true;
            }

            return false;
        };

        var tooEarlyMessage = function (gameDetails) {
            var start = gameDetails.start;
            var eventname = gameDetails.event;

            $scope.errorMessage = "'" + eventname + "' has not yet started. Check back again on " +
                gameUtils.dateString(start) + ".";
        }

        var newsTickerStarted = false;
        var startNewsTicker = function () {
            // set up our scrolling news feed with CSS magic
            newsTickerStarted = true;

            if (document.getElementById("newsfeed-text")) {
                var width = document.getElementById("newsfeed-text").offsetWidth * 2;
                var containerwidth = document.getElementById("newsfeed-container").offsetWidth;
                var left = containerwidth;

                function tick() {
                    if (--left < -width) {
                        left = containerwidth;
                    }

                    if (document.getElementById("newsfeed-text")) {
                        document.getElementById("newsfeed-text").style.marginLeft = left + "px";
                    }

                    setTimeout(tick, 32);
                }

                tick();
            }

        };

        var getNewsFeed = function (eventid) {

            gameData.loadNewsFeed(eventid)
                .then(function (feedItems) {
                        console.log("got feed items : " + JSON.stringify(feedItems));

                        // load each feed item into our ticker
                        var feedString = undefined;

                        for (var i = 0; i < feedItems.length; i++) {
                            var feedItem = feedItems[i];

                            if (feedString) {
                                feedString += " &nbsp;&nbsp~&nbsp;&nbsp; " + feedItem;
                            } else {
                                feedString = feedItem;
                            }
                        }

                        $scope.newsfeed = feedString;
                    },
                    function (error) {
                        console.error("Couldn't get news feed!");

                        var courseinfo = $scope.courseinfo;

                        // on error, just default to showing course information
                        $scope.newsfeed = "Course: " + courseinfo.course +
                            " &nbsp;&nbsp;~&nbsp;&nbsp; Par: " + courseinfo.par +
                            " &nbsp;&nbsp;~&nbsp;&nbsp; Yardage: " +
                            courseinfo.yardage;
                    });
        };

        var getWeatherForecast = function ($scope, location) {

            console.log("weatherForecast for " + JSON.stringify(location));

            if (location) {

                weatherData.forecast(location.lat, location.lng)
                    .then(function (data) {
                            console.log("Data from weather service: " + JSON.stringify(data));

                            data.temp = Math.round(data.temp);
                            data.wind = Math.round(data.wind);
                            data.metric.temp = Math.round(data.metric.temp);

                            $scope.weather = data;
                            $scope.weatherImg = '<img src="' + data.icon + '">';
                        },
                        function (err) {
                            console.log("Error from weather service: " + err);
                        });
            }

        };

        // called when we've loaded initial game data
        var gameLoadedHandler = function (game) {

            // if the tournament hasn't started, don't display the leaderboard
            var gameDetails = gameUtils.getGameDetails(game);

            if (!testingMode && hasNotStarted(gameDetails)) {

                console.log("too early!");
                tooEarlyMessage(gameDetails);

            } else {

                // build the leaderboard information by combining latest event scoring
                // information with the players selected by the gamers
                gameData.loadLeaderboard(game)
                    .then(function (result) {
                            var event = result.name;
                            var courseinfo = result.courseInfo;
                            var gamers = result.gamers;

                            if (gamers) {

                                //console.debug(JSON.stringify(gamers));

                                console.debug("getting news for event " + game.eventid);
                                getNewsFeed(game.eventid);

                                $scope.event = event;
                                $scope.eventLeaderUrl = "#/eventleaders/id/" + game.eventid;
                                $scope.eventOverviewUrl = "#/eventdetails/id/" + game.eventid;

                                var currentRound = eventUtils.getCurrentRound(courseinfo);
                                var currentCourse = courseinfo[currentRound - 1];
                                var roundTitles = eventUtils.getRoundTitles(courseinfo, "Day");

                                $scope.courseinfo = currentCourse;
                                $scope.currentRound = currentRound;
                                $scope.roundTitles = roundTitles;

                                $scope.newsfeed = "Course: " + currentCourse.name +
                                    " &nbsp;&nbsp;~&nbsp;&nbsp; Par: " + currentCourse.par +
                                    " &nbsp;&nbsp;~&nbsp;&nbsp; Yardage: " +
                                    currentCourse.yardage;

                                $scope.gamers = gamers;
                                $scope.loaded = true;
                                $scope.statusMessage = "";

                                getWeatherForecast($scope, currentCourse.location);

                                var now = Date.now();

                                $scope.lastUpdate = "Last Update: " +
                                    gameUtils.dayOfWeekString(now) + ", " +
                                    gameUtils.timeString(now);

                                if (!newsTickerStarted) {
                                    startNewsTicker();
                                }
                            } else {
                                console.error("No players for the current game.");
                                $scope.statusMessage = "No players for the current game.";
                            }

                        },
                        function (error) {
                            console.error("Couldn't access leaderboard information!");

                            $scope.errorMessage = "Couldn't access leaderboard information!";
                        });
            }
        }

        if (gameid) {
            console.log("Loading game " + gameid);

            gameData.loadGame(gameid)
                .then(gameLoadedHandler,
                    function (error) {
                        // The object was not retrieved successfully.
                        console.error("Couldn't access game information!");

                        $scope.errorMessage = "Couldn't access game information!";
                    })
        } else {
            console.log("error! no gameid specified!");
            $scope.errorMessage = "error! no gameid specified!";
        }

    }

    $scope.onRefresh = function () {
        console.log("Refreshing leaderboard");

        // Go back to the Cloud and load a new set of Objects 
        // as a hard refresh has been done
        $scope.loadItems();

        // set the timeout interval to refresh every 5 minutes
        setTimeout($scope.onRefresh, 5000 * 60);
    };

    $scope.onRefresh();
};
