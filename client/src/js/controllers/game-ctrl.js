angular.module('GolfPicks')
    .controller('GameCtrl', ['$scope', '$stateParams', 'gameData', GameCtrl]);

function GameCtrl($scope, $stateParams, gameData) {

    console.log("reached game controller with id " + $stateParams.id);

    if ($stateParams.id) {

        gameData.loadGameWithGamers($stateParams.id)
            .then(function (result) {
                    var game = result.game;
                    var gamerMap = result.gamerMap;

                    // see which gamers have made their picks
                    var picks = [];
                    var nopicks = [];

                    for (var i = 0; i < game.gamers.length; i++) {
                        var gamer = game.gamers[i];

                        if (gamer.picks) {
                            picks.push(gamerMap[gamer.user]);

                            //remove it from the list
                            delete gamerMap[gamer.user];
                        }
                    }

                    console.log("remaining players " + JSON.stringify(gamerMap));

                    // the remaining objects in the list are folks who haven't
                    // yet made their picks
                    for (var prop in gamerMap) {
                        nopicks.push(gamerMap[prop]);
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
