console.log("picks");

angular.module('GolfPicksMobile')
    .controller('PicksCtrl', ['$rootScope', '$scope', '$state',
                                '$stateParams', '$location', '$ionicLoading',
                                '$ionicModal', 'cloudDataCurrentUser', 'cloudDataGame',
                                'gameData', 'gameUtils', PicksCtrl]);

// Submit picks
function PicksCtrl($rootScope, $scope, $state, $stateParams,
    $location, $ionicLoading, $ionicModal,
    currentUser, cloudDataGame, gameData, gameUtils) {

    var loginUrl = "login";

    var NUM_SELECTIONS = 3;
    var NUM_TOP_ALLOWED = 1;
    var NUM_TOP_RANK = 2;
    var changed = false;
    var players = [];
    var logger = gameUtils.logger;
    var currentGame = undefined;

    // TODO: fix this for non PGA
    var isPGA = true;

    if (isPGA) {
        NUM_SELECTIONS = 10;
        NUM_TOP_ALLOWED = 2;
        NUM_TOP_RANK = 10;
    }

    // initialize the bound variables here.  if we don't initialize these up front
    // then the input values don't get bound properly. 
    // http://stackoverflow.com/questions/24027497/phonegap-ionic-scope-inside-of-click-function-not-updating
    $scope.statusMessage = "";
    $scope.input = {
        username: "",
        password: ""
    };
    $scope.views = ["Show All", "Show Picks"];
    $scope.showView = $scope.views[0];

    $scope.filterPicks = function (show) {
        console.log("show  = " + show);

        return function (player) {

            if (show == $scope.views[1] && !player.selected) {
                return false;
            } else {
                return true;
            }
        };
    };

    $scope.showViewUpdate = function (showView) {
        // not clear why we have to do this.. most likely a scope issue that I couldn't figure out
        // but we basically set the $scope.showView variable explicitly when the <select> is updated
        console.log("showView  = " + showView + " scope.showView " + $scope.showView);
        $scope.showView = showView;
    };

    // Create our modal
    $ionicModal.fromTemplateUrl('templates/rules.html', function (modal) {
        console.log("got to modal!");
        $scope.itemModal = modal;
    }, {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    });


    if (!currentUser.isLoggedIn()) {
        console.error("No logged in user!");
        $state.go(loginUrl);
        return;
    }


    // if testingMode is a url parameter, turn off some of the date/rule checking
    var testingMode = $location.search().testingMode ? true : false;

    // functions
    var debug = function (str) {
        // uncomment to turn on debugging
        //	$( "#debug" ).html( str );
    };

    var sortByRank = function (records) {

        records.sort(function (a, b) {
            // if unranked supply a sufficiently high numbrer
            var aRank = (a.rank == "-") ? 1000 : a.rank;
            var bRank = (b.rank == "-") ? 1000 : b.rank;
            return aRank - bRank
        });

        return records;
    };

    var update = function ($scope, players, selections) {
        $scope.players = players;
        $scope.selections = selections;
    }

    var addPlayer = function (players, ndx) {
        players[ndx].selected = true;
    };

    var removePlayer = function (players, ndx) {
        players[ndx].selected = false;
    };

    var formatRank = function (rank) {
        var val = parseInt(rank);
        if (isNaN(val)) val = "-";

        return (val <= 10) ? "<b>" + val + "</b>" : val;
    }

    var getSelections = function (players) {
        var selections = [];

        players.forEach(function (player) {
            if (player.selected) selections.push(player);
        });

        return selections;
    };

    var updateSelections = function (selections, players) {

        var numSelections = 0;
        var numTopPicks = 0;

        selections.forEach(function (selection) {
            numSelections++;
            if (selection.index <= NUM_TOP_RANK) numTopPicks++;
        });

        // now disable based on this
        players.forEach(function (player) {
            if (player.selected) { // always enable any currently selected scores
                player.selectable = true;
                //                    console.log("Selected : " + JSON.stringify(player));
            } else {
                // disable the rest based on current picks
                if (numSelections >= NUM_SELECTIONS) {
                    player.selectable = false;
                } else if (numTopPicks >= NUM_TOP_ALLOWED && player.index <= NUM_TOP_RANK) {
                    player.selectable = false;
                } else {
                    player.selectable = true;
                }
            }
        });

        console.log("selections = " + numSelections + ", topPicks = " + numTopPicks);

        return numSelections;
    };

    var findPlayerIndex = function (players, id) {
        // use a player id to find the index for this player in the scores list
        for (var i = 0; i < players.length; i++) {
            if (players[i].player_id == id) {
                return i;
            }
        }

        return -1;
    };

    var loadSavedPicks = function (players, picks) {
        // for each pick we find, move it from scores to selections
        for (var i = 0; i < picks.length; i++) {
            var ndx = findPlayerIndex(players, picks[i].id);

            if (ndx < 0) {
                console.error("invalid pick " + picks[i].id + " found!");
            } else {
                addPlayer(players, ndx);
            }
        }

        // reset changed flag, we just loaded the saved picks.
        changed = false;

        var selections = getSelections(players);

        updateSelections(selections, players);
    };


    // go get the current game data to load the app
    var gameid = $stateParams.eventid;
    console.log("Game id: " + gameid);

    // get the event information
    if (gameid) {

        // Refresh
        if (!$scope.$$phase) {
            $scope.$apply();
        }

        // Because we are retrieving all the items every time we do something
        // We need to clear the list before loading in some new values
        $ionicLoading.show({
            template: 'Loading...'
        });

        cloudDataGame.get(gameid)
            .then(function (game) {

                    currentGame = game;

                    if (!testingMode) {
                        var gameDetails = gameUtils.getGameDetails(game);

                        // give players a 10 hr grace period
                        // (10AM on day of tournament) to complete picks
                        gameDetails = gameUtils.addGracePeriod(gameDetails, 10);

                        if (gameUtils.tournamentInProgress(gameDetails.start,
                                gameDetails.end)) {

                            $scope.statusMessage = "Tournament is in progress, picks can no longer be made.";

                            // Trigger refresh complete on the pull to refresh action
                            $scope.$broadcast('scroll.refreshComplete');

                            $ionicLoading.hide();

                            return;
                        } else if (gameUtils.tournamentComplete(gameDetails.start,
                                gameDetails.end)) {

                            $scope.statusMessage = "This tournament has already ended, picks can no longer be made.";

                            // Trigger refresh complete on the pull to refresh action
                            $scope.$broadcast('scroll.refreshComplete');

                            $ionicLoading.hide();

                            return;
                        }
                    }


                    gameData.loadRankedPlayers(game.eventid)
                        .then(function (result) {
                                var event = result.event;
                                var golfers = result.golfers;

                                if (!game.gamers) {
                                    game.gamers = [{
                                        "user": currentUser.getId(),
                                        "picks": []
                            }];
                                } else {
                                    // might have previously stored picks
                                    var picks = [];
                                    var gamers = game.gamers;

                                    for (var i = 0; i < gamers.length; i++) {
                                        var gamer = gamers[i];
                                        if (gamer.user == currentUser.getId()) {
                                            picks = gamer.picks;
                                        }
                                    }

                                    loadSavedPicks(golfers, picks);
                                    debug("Picks : " + JSON.stringify(picks));
                                }

                                $scope.name = event.name;
                                $scope.start = event.start;
                                $scope.end = event.end;
                                $scope.rounds = event.rounds;
                                $scope.players = golfers;
                                $scope.NUM_SELECTIONS = NUM_SELECTIONS;
                                $scope.NUM_TOP_RANK = NUM_TOP_RANK;
                                $scope.loaded = true;

                                console.log("golfers: " + JSON.stringify(golfers));


                                // Trigger refresh complete on the pull to refresh action
                                $scope.$broadcast('scroll.refreshComplete');

                                $ionicLoading.hide();

                            },
                            function (err) {
                                console.log("error getting event: " + err);

                                $scope.statusMessage = "Couldn't access event information!";

                                // Trigger refresh complete on the pull to refresh action
                                $scope.$broadcast('scroll.refreshComplete');

                                $ionicLoading.hide();
                            });
                },
                function (err) {
                    logger.error("Couldn't access game information!");

                    $scope.statusMessage = "Couldn't access game information!";

                    // Trigger refresh complete on the pull to refresh action
                    $scope.$broadcast('scroll.refreshComplete');

                    $ionicLoading.hide();
                });

    }



    $scope.updatePlayer = function (item) {
        //			console.log("item: " + JSON.stringify(item));
        console.log("clicked on item " + item.name + " state is " + item.selected);

        $scope.picksMessage = "";

        var selections = getSelections($scope.players);

        // enforce the game rules here
        // tell player how many more they can pick
        // enable/disable the submit button
        var numSelections = updateSelections(selections, $scope.players);

        if (numSelections >= NUM_SELECTIONS) {
            $scope.canSubmit = true;
            $scope.picksMessage = "Press Save Picks to save.";
        } else {
            var remaining = NUM_SELECTIONS - numSelections;
            var picks = (remaining > 1) ? "picks" : "pick";
            $scope.picksMessage = remaining + " " + picks + " remaining.";
        }

    }

    $scope.submit = function () {
        $scope.picksMessage = "Saving picks...";

        // Refresh
        if (!$scope.$$phase) {
            $scope.$apply();
        }

        // Because we are retrieving all the items every time we do something
        // We need to clear the list before loading in some new values
        $ionicLoading.show({
            template: 'Saving...'
        });

        $scope.picksMessage = "Saving picks...";

        // update this person's picks in the game data
        var selections = getSelections($scope.players);

        var picks = [];
        selections.forEach(function (selection) {
            picks.push({
                "id": selection.player_id
            });
        });

        console.log("saving picks: " + JSON.stringify(picks));

        cloudDataGame.savePicks(currentGame, currentUser, picks)
            .then(function (game) {
                    $scope.picksMessage = "Picks saved.";

                    changed = false;

                    // Trigger refresh complete on the pull to refresh action
                    $scope.$broadcast('scroll.refreshComplete');

                    $ionicLoading.hide();
                },
                function (err) {
                    console.error("error saving picks");

                    $scope.picksMessage = "Error saving picks!";

                    // Trigger refresh complete on the pull to refresh action
                    $scope.$broadcast('scroll.refreshComplete');

                    $ionicLoading.hide();
                });

    };

    $scope.gameRules = function () {
        console.log("Showing game rules");

        $scope.itemModal.show();
    };

    $scope.closeItem = function () {
        // Reverse the Paint Bug
        $scope.itemModal.hide();

    }

};
