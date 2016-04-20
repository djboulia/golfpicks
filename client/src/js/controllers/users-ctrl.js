angular.module('GolfPicks')
    .controller('PlayersCtrl', ['$scope', '$cookieStore', 'cloudDataPlayer', PlayersCtrl]);

function PlayersCtrl($scope, $cookieStore, cloudDataPlayer) {
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
