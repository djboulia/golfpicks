console.log("historytab!");

var pages = {
    loginUrl: "login",
    postLoginUrl: "tab.list-index",
    leaderboardUrl: "tab.leaderboard",
    gamerUrl: "gamer",
    picksUrl: "#/picks"
};


angular.module('GolfPicksMobile')
    .controller('HistoryCtrl', ['$rootScope', '$scope', '$state',
                                '$location', '$ionicLoading',
                                'cloudDataCurrentUser', 'gameData', HistoryCtrl]);

// Display Tournament History for the current player
function HistoryCtrl($rootScope, $scope, $state, $location, $ionicLoading,
    cloudDataCurrentUser, gameData) {

    var loginUrl = "login";

    // Form Model
    $scope.item = {};

    $scope.loadItems = function () {

        console.log("Loading tournament history here");

        if (!cloudDataCurrentUser.isLoggedIn()) {
            console.error("No logged in user!");
            $state.go(loginUrl);
            return;
        }

        // Clear the List before adding new items
        // This needs to be improved
        $scope.list = [];

        // Because we are retrieving all the items every time we do something
        // We need to clear the list before loading in some new values
        $ionicLoading.show({
            template: 'Loading...'
        });

        // if testingMode is a url parameter, turn off some of the date/rule checking
        var testingMode = $location.search().testingMode ? true : false;

        gameData.loadUserGameHistory(cloudDataCurrentUser)
            .then(function (gameHistory) {
                    //console.log( JSON.stringify( gameHistory ));

                    var statusMessage = "";

                    if (!testingMode && gameHistory.active.inProgress) {

                        statusMessage = "Tournament in progress:<br><b>" +
                            gameHistory.active.event + "</b>";

                    } else {
                        if (gameHistory.active.eventid) {
                            var picksUrl = pages.picksUrl + "/" + gameHistory.active.eventid;

                            if (gameHistory.active.joined) {
                                statusMessage = 'Upcoming tournament:<br><b>' +
                                    gameHistory.active.event +
                                    '</b><br>The tournament has not yet started.  You can still update your <a href="' +
                                    picksUrl + '">picks</a>';
                            } else {
                                statusMessage = 'Upcoming tournament:<br><b>' +
                                    gameHistory.active.event +
                                    '</b><br>You have not yet joined this event. Make your <a href="' + picksUrl + '">picks</a>';
                            }
                        } else {
                            statusMessage = 'No upcoming tournament.';
                        }
                    }

                    console.log("Active game: " + JSON.stringify(gameHistory.active));

                    $scope.statusMessage = statusMessage;
                    $scope.active = gameHistory.active;
                    $scope.gameHistory = gameHistory.history;
                    $scope.loaded = true;

                    // Trigger refresh complete on the pull to refresh action
                    $scope.$broadcast('scroll.refreshComplete');

                    $ionicLoading.hide();
                },
                function (err) {
                    $scope.statusMessage = "Error loading game history!";

                    // Trigger refresh complete on the pull to refresh action
                    $scope.$broadcast('scroll.refreshComplete');

                    $ionicLoading.hide();
                });

    }

    $scope.loadItems();

    $scope.selectGame = function (game) {
        console.log("Clicked on game " + game.event);

        var pathUrl = pages.leaderboardUrl;
        $state.go(pathUrl, {
            eventid: game.eventid
        });
    };

    $scope.onRefresh = function () {
        // Go back to the Cloud and load a new set of Objects as a hard refresh has been done
        $scope.loadItems();
    };

};
