angular.module('GolfPicks')
    .controller('PlayerCtrl', ['$scope', '$stateParams',
                               '$uibModal', 'cloudDataPlayer', PlayerCtrl]);


function PlayerCtrl($scope, $stateParams, $uibModal, cloudDataPlayer) {
    var returnUrl = "#/users";

    console.log("reached player controller with id " + $stateParams.id);

    var existingPlayer = undefined;

    if ($stateParams.id) {
        // load up the existing data in our form
        $scope.title = "Update User";

        cloudDataPlayer.get($stateParams.id)
            .then(function (playerObject) {
                    existingPlayer = playerObject;

                    $scope.name = existingPlayer.name;
                    $scope.email = existingPlayer.email;
                    $scope.password = existingPlayer.password;
                    $scope.existingPlayer = true;
                    $scope.loaded = true;
                },
                function (err) {
                    console.log("error getting user " + err);
                });
    } else {
        $scope.title = "New User";
        $scope.loaded = true;
    }

    $scope.submit = function () {

        if (existingPlayer) {
            console.log("save existing player here...");

            existingPlayer.name = this.name;
            existingPlayer.email = this.email;
            existingPlayer.password = this.password;

            cloudDataPlayer.save(existingPlayer)
                .then(function (playerObject) {
                        console.log("saved player " + playerObject.name);

                        // switch to players page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error adding player " + err);
                    });
        } else {
            var player = {
                name: this.name,
                email: this.email,
                password: this.password,
                handicap: this.handicap
            };

            console.log("create new player " + player.name + " here");

            cloudDataPlayer.add(player)
                .then(function (playerObject) {
                        console.log("saved player " + playerObject.name);

                        // switch to picks page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error adding player " + err);
                    });
        }

    };

    $scope.delete = function () {

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'deletePlayer.html',
            controller: 'ModalPlayerDeleteCtrl',
            resolve: {
                player: function () {
                    return existingPlayer;
                }
            }
        });

        modalInstance.result.then(function (player) {
            console.log("Deleting player " + player.name);
            cloudDataPlayer.delete(player)
                .then(function (obj) {
                    console.log("delete successful");

                    // switch to players page
                    window.location.href = returnUrl;
                },
                function (err) {
                    console.log("error from delete : " + err);
                });

        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

};

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('GolfPicks')
    .controller('ModalPlayerDeleteCtrl', ['$scope', '$uibModalInstance', 'player', ModalPlayerDeleteCtrl]);

function ModalPlayerDeleteCtrl($scope, $uibModalInstance, player) {
    $scope.player = player;

    $scope.ok = function () {
        $uibModalInstance.close(player);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}
