angular.module('GolfPicks')
    .controller('AllGamesCtrl', ['$scope', '$cookieStore', '$location', '$sanitize', 'cloudDataCurrentUser', 'gameData', AllGamesCtrl]);

function AllGamesCtrl($scope, $cookieStore, $location, $sanitize, currentUser, gameData) {

    var gameUrl = "#/game";
    var picksUrl = "#/picks";

    console.log("reached allgames controller!");

    var testingMode = $location.search().testingMode ? true : false;
    console.log("testingMode is set to " + testingMode);

    gameData.loadGames()
        .then(function (games) {

                var statusMessage = "";

                console.log("games : " + JSON.stringify(games));

                $scope.statusMessage = statusMessage;
                $scope.gameUrl = gameUrl;
                $scope.games = games;
                $scope.loaded = true;

            },
            function (err) {
                $scope.statusMessage = "Error loading game history!";
            });
};
