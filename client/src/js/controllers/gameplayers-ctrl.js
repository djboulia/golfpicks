angular.module('GolfPicks')
    .controller('GamePlayersCtrl', ['$scope', '$stateParams', 'gameData', GamePlayersCtrl]);

function GamePlayersCtrl($scope, $stateParams, gameData) {

    console.log("reached game controller with id " + $stateParams.id);

    if ($stateParams.id) {

        gameData.loadGameWithGamers($stateParams.id)
            .then(function (result) {
                    const game = result;
                    const gamers = game.gamers;

                    // see which gamers have made their picks
                    const picks = [];
                    const nopicks = [];

                    for (var i = 0; i < gamers.length; i++) {
                        var gamer = gamers[i];

                        if (gamer.picks) {
                            picks.push(gamer);
                        } else {
                            nopicks.push(gamer);
                        }
                    }

                    console.log("picks: " + JSON.stringify(picks));
                    console.log("nopicks: " + JSON.stringify(nopicks));

                    $scope.name = game.name;
                    $scope.start = game.start;
                    $scope.end = game.end;
                    $scope.picks = picks;
                    $scope.nopicks = nopicks;
                    $scope.loaded = true;

                },
                function (err) {
                    console.log("error getting event: " + err);
                });
    }

    $scope.formatDate = function (strDate) {
        var date = new Date(strDate);
        return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear()
    };

};
