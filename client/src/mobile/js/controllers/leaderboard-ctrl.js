console.log("leaderboard!");

angular.module('GolfPicksMobile')
    .controller('LeaderboardCtrl', ['$rootScope', '$scope', '$state', '$stateParams',
                                '$location', '$ionicLoading',
                                'cloudDataCurrentUser', 'gameData', 'gameUtils',
                                'eventUtils', 'gameDataCache', LeaderboardCtrl]);

// Display Tournament History for the current player
function LeaderboardCtrl($rootScope, $scope, $state,
    $stateParams, $location, $ionicLoading,
    cloudDataCurrentUser, gameData, gameUtils, eventUtils, gameDataCache) {

    console.log("state passed " + $stateParams.eventid);

    var loadItems = function () {

        var loginUrl = "login";

        if (!cloudDataCurrentUser.isLoggedIn()) {
            console.error("No logged in user!");
            $state.go(loginUrl);
            return;
        }

        // Refresh
        if (!$scope.$$phase) {
            $scope.$apply();
        }

        // Because we are retrieving all the items every time we do something
        // We need to clear the list before loading in some new values
        $ionicLoading.show({
            template: 'Loading...'
        });

        // if testingMode is a url parameter, turn off some of the date/rule checking
        var testingMode = $location.search().testingMode ? true : false;

        // if debugMode is a url parameter, write more info to the log
        var debugMode = $location.search().debugMode ? true : false;

        var hasNotStarted = function (gameDetails) {
            if (!gameUtils.tournamentInProgress(gameDetails.start, gameDetails.end) &&
                !gameUtils.tournamentComplete(gameDetails.start, gameDetails.end)) {
                return true;
            }

            return false;
        };

        var tooEarlyMessage = function (gameDetails) {
            $scope.statusMessage = "Tournament Leaderboard<br/><br/>'" + gameDetails.name + "' has not yet started.<br/>  Check back again on " + dateString(gameDetails.start) + ".";
        };

        var newsTickerStarted = false;
        var startNewsTicker = function () {
            // set up our scrolling news feed with CSS magic
            newsTickerStarted = true;

            var width = document.getElementById("newsfeed-text").offsetWidth * 2,
                containerwidth = document.getElementById("newsfeed-container").offsetWidth,
                left = containerwidth;

            function tick() {
                if (--left < -width) {
                    left = containerwidth;
                }
                document.getElementById("newsfeed-text").style.marginLeft = left + "px";
                setTimeout(tick, 32);
            }
            tick();
        };

        var updateScope = function (gameData) {
            var courseInfo = gameData.courseInfo;

            $scope.event = gameData.event;
            $scope.eventid = $stateParams.eventid;
            $scope.courseInfo = courseInfo;
            $scope.currentRound = gameData.currentRound;
            $scope.roundTitles = gameData.roundTitles;
            $scope.displayRounds = gameData.displayRounds;
            $scope.newsfeed = "Course: " + courseInfo.name + " Par: " +
                courseInfo.par + " Yardage: " + courseInfo.yardage;
            $scope.gamers = gameData.gamers;
            $scope.watson = gameData.watson;
            $scope.loaded = true;
            $scope.statusMessage = undefined;
        };

        var gameid = $stateParams.eventid;

        var getNewsFeed = function (eventid) {

            gameData.loadNewsFeed(eventid)
                .then(function (feedItems) {
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

                        console.log("about to load news feed");

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

        // called when we've loaded initial game data
        var gameLoadedHandler = function (game) {

            // if the tournament hasn't started, don't display the leaderboard
            var gameDetails = gameUtils.getGameDetails(game);

            if (!testingMode && hasNotStarted(gameDetails)) {

                tooEarlyMessage(gameDetails);

                // Trigger refresh complete on the pull to refresh action
                $scope.$broadcast('scroll.refreshComplete');

                $ionicLoading.hide();
            } else {

                // build the leaderboard information by combining latest event scoring
                // information with the players selected by the gamers
                gameData.loadLeaderboard(game)
                    .then(function (result) {
                            var event = result.name;
                            var courseinfo = result.courseInfo;
                            var gamers = result.gamers;
                            var watson = result.watson;

                            if (gamers) {

                                console.debug(JSON.stringify(gamers));

                                console.debug("getting news for event " + game.eventid);
                                getNewsFeed(game.eventid);

                                var currentRound = eventUtils.getCurrentRound(courseinfo);
                                var currentCourse = courseinfo[currentRound - 1];
                                var roundTitles = eventUtils.getRoundTitles(courseinfo);

                                // only display a maximum of 4 rounds on mobile devices
                                var displayRounds = eventUtils.getDisplayRounds(currentRound, courseinfo.length, 4);

                                var gameData = {
                                    event: event,
                                    courseInfo: currentCourse,
                                    currentRound: currentRound,
                                    roundTitles: roundTitles,
                                    displayRounds: displayRounds,
                                    gamers: gamers,
                                    watson: watson
                                };

                                updateScope(gameData);

                                // cache the result
                                if (gameid) {
                                    console.log("Caching gameData result for event " + event);

                                    gameDataCache.set(gameid, gameData);
                                }

                                // Trigger refresh complete on the pull to refresh action
                                $scope.$broadcast('scroll.refreshComplete');

                                $ionicLoading.hide();
                            } else {
                                console.error("No players for the current game.");

                                $scope.statusMessage = "No players for the current game.";

                                // Trigger refresh complete on the pull to refresh action
                                $scope.$broadcast('scroll.refreshComplete');

                                $ionicLoading.hide();
                            }

                        },
                        function (error) {
                            console.error("Couldn't access leaderboard information!");

                            $scope.statusMessage = "Couldn't access leaderboard information!";

                            // Trigger refresh complete on the pull to refresh action
                            $scope.$broadcast('scroll.refreshComplete');

                            $ionicLoading.hide();
                        });
            }
        }

        if (gameid) {
            var cachedGameData = gameDataCache.get(gameid);

            if (cachedGameData) {
                console.log("Loading event " + cachedGameData.event + " from cache!");

                updateScope(cachedGameData);

                // Trigger refresh complete on the pull to refresh action
                $scope.$broadcast('scroll.refreshComplete');

                $ionicLoading.hide();
            } else {
                gameData.loadGame(gameid)
                    .then(gameLoadedHandler,
                        function (error) {
                            // The object was not retrieved successfully.
                            console.error("Couldn't access game information!");
                            $scope.statusMessage = "Couldn't access game information!";

                            // Trigger refresh complete on the pull to refresh action
                            $scope.$broadcast('scroll.refreshComplete');

                            $ionicLoading.hide();
                        });
            }

            if (!newsTickerStarted) {
                startNewsTicker();
            }
        } else {
            console.log("error! no gameid specified!");

            $scope.statusMessage = "error! no gameid specified!";
        }

    }

    $scope.selectGamer = function (gamer) {
        console.log("Clicked on gamer " + gamer.name);

        var pathUrl = "tab.gamer";

        console.log("calling $state.go on " + pathUrl);

        $state.go(pathUrl, {
            gamer: gamer.objectId,
            eventid: $stateParams.eventid
        });
    };

    $scope.selectWatson = function () {
        console.log("Clicked on Watson ");

        var pathUrl = "tab.gamer";

        console.log("calling $state.go on " + pathUrl);

        $state.go(pathUrl, {
            gamer: "watson",
            eventid: $stateParams.eventid
        });
    };

    $scope.onRefresh = function () {
        console.log("Refreshing leaderboard");

        // clear the cache for this item
        var eventid = $stateParams.eventid;

        gameDataCache.clear(eventid);

        // Go back to the Cloud and load a new set of Objects as a hard refresh has been done
        loadItems();

        // set the timeout interval to refresh every 5 minutes
        setTimeout($scope.onRefresh, 5000 * 60);
    };

    loadItems();

    // set the timeout interval to refresh every 5 minutes
    setTimeout($scope.onRefresh, 5000 * 60);

};
