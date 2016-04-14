angular.module('GolfPicks')
    .controller('PicksCtrl', ['$scope', '$stateParams', '$cookieStore',
                              '$location', '$sanitize', 'cloudDataGame',
                              'gameData', 'cloudDataCurrentUser',
                              'gameUtils', PicksCtrl]);


function PicksCtrl($scope, $stateParams, $cookieStore,
    $location, $sanitize, cloudDataGame, gameData, currentUser, gameUtils) {

    var NUM_SELECTIONS = 3;
    var NUM_TOP_ALLOWED = 1;
    var NUM_TOP_RANK = 2;
    var changed = false;
    var gameid = $stateParams.id;
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

    console.log("reached picks controller with event id " + gameid);

    var testingMode = $location.search().testingMode ? true : false;
    console.log("testingMode is set to " + testingMode);

    // functions
    var debug = function (str) {
        // uncomment to turn on debugging
        //	$( "#debug" ).html( str );
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



    // get the event information
    if (gameid) {

        cloudDataGame.get(gameid, {
            success: function (game) {

                currentGame = game;

                if (!testingMode) {
                    var gameDetails = gameUtils.getGameDetails(game);

                    // give players a 10 hr grace period 
                    // (10AM on day of tournament) to complete picks
                    gameDetails = gameUtils.addGracePeriod(gameDetails, 10);

                    if (gameUtils.tournamentInProgress(gameDetails.start,
                            gameDetails.end)) {
                        $scope.$apply(function () {
                            $scope.errorMessage = "Tournament is in progress, picks can no longer be made.";
                        });

                        return;
                    } else if (gameUtils.tournamentComplete(gameDetails.start,
                            gameDetails.end)) {
                        $scope.$apply(function () {
                            $scope.errorMessage = "This tournament has already ended, picks can no longer be made.";
                        });

                        return;
                    }
                }

                gameData.loadRankedPlayers(game.eventid, {
                    success: function (event, players) {

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

                            loadSavedPicks(players, picks);
                            debug("Picks : " + JSON.stringify(picks));
                        }

                        $scope.name = event.name;
                        $scope.start = event.start;
                        $scope.end = event.end;
                        $scope.rounds = event.rounds;
                        $scope.players = players;
                        $scope.NUM_SELECTIONS = NUM_SELECTIONS;
                        $scope.NUM_TOP_RANK = NUM_TOP_RANK;
                        $scope.NUM_TOP_ALLOWED = NUM_TOP_ALLOWED;
                        $scope.loaded = true;

                    },
                    error: function (err) {
                        console.log("error getting event: " + err);

                        $scope.$apply(function () {
                            $scope.errorMessage = "Couldn't access event information!";
                        });
                    }
                });
            },
            error: function (err) {
                logger.error("Couldn't access game information!");

                $scope.$apply(function () {
                    $scope.errorMessage = "Couldn't access game information!";
                });
            }
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

        // update this person's picks in the game data
        var selections = getSelections($scope.players);

        var picks = [];
        selections.forEach(function (selection) {
            picks.push({
                "id": selection.player_id
            });
        });

        console.log("saving picks: " + JSON.stringify(picks));

        cloudDataGame.savePicks(currentGame, currentUser, picks, {
            success: function (game) {
                $scope.$apply(function () {
                    $scope.picksMessage = "Picks saved.";
                });
                changed = false;
            },
            error: function (err) {
                console.error("error saving picks");
                $scope.$apply(function () {
                    $scope.picksMessage = "Error saving picks!";
                });
            }
        });
    };


};