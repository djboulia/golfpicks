angular.module('GolfPicks')
    .controller('PlayersCtrl', ['$scope', 'cloudDataPlayer', PlayersCtrl]);

function PlayersCtrl($scope, cloudDataPlayer) {
    var editUrl = '#/user';

    console.log("reached players controller, setting edit url to: " + editUrl);

    $scope.editUrl = editUrl;

    cloudDataPlayer.getAll()
        .then(function (players) {
                $scope.players = players;
                $scope.loaded = true;
            },
            function (err) {
                console.log("error");
            });
};
