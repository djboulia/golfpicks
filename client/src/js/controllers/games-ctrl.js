angular.module('GolfPicks')
    .controller('GamesCtrl', ['$scope', '$cookieStore', '$location', '$sanitize', 'cloudDataCurrentUser', 'gameData', GamesCtrl]);

function GamesCtrl($scope, $cookieStore, $location, $sanitize, currentUser, gameData) {

    var leaderboardUrl = "#/leaderboard";
    var picksUrl = "#/picks";

    console.log("reached games controller!");

    var testingMode = $location.search().testingMode ? true : false;
    console.log("testingMode is set to " + testingMode);

    gameData.loadUserGameHistory(currentUser, {
        success: function (gameHistory) {
            //console.log( JSON.stringify( gameHistory ));

            var statusMessage = "";

            if (!testingMode && gameHistory.active.inProgress) {
                statusMessage = "The tournament is currently in progress";
            } else {
                if (gameHistory.active.eventid) {
                    picksUrl = picksUrl + "/id/" + gameHistory.active.eventid;

                    if (gameHistory.active.joined) {
                        statusMessage = 'The game has not yet started.  You can still update your <a href="' + picksUrl + '">picks</a>';
                    } else {
                        statusMessage = 'You have not yet joined this game. Make your <a href="' + picksUrl + '">picks</a>';
                    }
                } else {
                    statusMessage = 'No upcoming tournament.';
                }
            }

            $scope.statusMessage = statusMessage;
            $scope.leaderboardUrl = leaderboardUrl;
            $scope.active = gameHistory.active;
            $scope.gameHistory = gameHistory.history;
            $scope.loaded = true;

        },
        error: function (err) {
            $scope.statusMessage = "Error loading game history!";
        }
    });
};
