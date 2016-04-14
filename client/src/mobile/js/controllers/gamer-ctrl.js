angular.module('GolfPicksMobile')
    .controller('GamerCtrl', ['$rootScope', '$scope', '$state', '$stateParams',
                                '$location', '$ionicLoading',
                                'cloudDataCurrentUser', 'gameData', 'gameUtils', 'eventUtils', 'gameDataCache', GamerCtrl]);

// Display Tournament History for the current player
function GamerCtrl($rootScope, $scope, $state,
    $stateParams, $location, $ionicLoading,
    cloudDataCurrentUser, gameData, gameUtils, eventUtils, gameDataCache) {

    console.log("state passed " + JSON.stringify($stateParams));

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
            $scope.$apply(function () {
                $scope.statusMessage = "Tournament Leaderboard<br/><br/>'" + gameDetails.name + "' has not yet started.<br/>  Check back again on " + dateString(gameDetails.start) + ".";
            });
        };

        var updateScope = function (gameData) {
            var gamers = gameData.gamers;
            
            // find the specific gamer we need
            for (var i = 0; i < gamers.length; i++) {
                var gamer = gamers[i];

                if (gamer.objectId == $stateParams.gamer) {
                    
                    console.debug(JSON.stringify(gamer));

                    $scope.gamer = gamer;
                    $scope.event = gameData.event;
                    $scope.courseInfo = gameData.courseInfo;
                    $scope.roundTitles = gameData.roundTitles;
                    $scope.displayRounds = gameData.displayRounds;
                    $scope.loaded = true;
                    $scope.statusMessage = undefined;
                }
            }

            // Trigger refresh complete on the pull to refresh action
            $scope.$broadcast('scroll.refreshComplete');

            $ionicLoading.hide();

        };

        var gameid = $stateParams.eventid;

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
                gameData.loadLeaderboard(game, {
                    success: function (event, courseinfo, gamers) {

                        if (gamers) {

                            console.debug(JSON.stringify(gamers));

                            
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
                                gamers: gamers
                            };


                            $scope.$apply(function () {
                                updateScope(gameData);
                            });

                            // cache the result
                            if (gameid) {
                                console.log("Caching gameData result for event " + event);
                                gameDataCache.set(gameid, gameData);
                            }

                        } else {
                            console.error("No players for the current game.");
                            $scope.$apply(function () {
                                $scope.statusMessage = "No players for the current game.";
                            });

                            // Trigger refresh complete on the pull to refresh action
                            $scope.$broadcast('scroll.refreshComplete');

                            $ionicLoading.hide();
                        }

                    },
                    error: function (error) {
                        console.error("Couldn't access leaderboard information!");

                        $scope.$apply(function () {
                            $scope.errorMessage = "Couldn't access leaderboard information!";
                        });

                        // Trigger refresh complete on the pull to refresh action
                        $scope.$broadcast('scroll.refreshComplete');

                        $ionicLoading.hide();
                    }
                });
            }
        }

        var gameLoadedErrHandler = function (error) {
            // The object was not retrieved successfully.
            console.error("Couldn't access game information!");
            $scope.$apply(function () {
                $scope.statusMessage = "Couldn't access game information!";
            });

            // Trigger refresh complete on the pull to refresh action
            $scope.$broadcast('scroll.refreshComplete');

            $ionicLoading.hide();
        }

        if (gameid) {
            var cachedGameData = gameDataCache.get(gameid);

            if (cachedGameData) {
                console.log("Loading event " + cachedGameData.event + " from cache!");

                updateScope(cachedGameData);
            } else {
                gameData.loadGame(gameid, {
                    success: gameLoadedHandler,
                    error: gameLoadedErrHandler
                });
            }
        } else {
            console.log("error! no gameid specified!");

            $scope.statusMessage = "error! no gameid specified!";
        }

    }

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