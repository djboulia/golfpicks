angular.module('GolfPicks')
    .controller('ProfileCtrl', ['$scope', 'cloudDataCurrentUser',
        'cloudDataPlayer', ProfileCtrl]);


function ProfileCtrl($scope, currentUser, cloudDataPlayer) {

    console.log("reached profile controller");

    var existingPlayer = undefined;

    // load up the existing data in our form
    $scope.title = "Update Profile";

    cloudDataPlayer.get(currentUser.getId())
        .then(function (playerObject) {
            console.log("playerObject " + JSON.stringify(playerObject));

            existingPlayer = playerObject;

            $scope.name = existingPlayer.name;
            $scope.email = existingPlayer.email;
            $scope.password = existingPlayer.password;
            $scope.existingPlayer = true;
        },
            function (err) {
                console.log("error getting user " + err);
            });

    $scope.submit = function () {

        var currentScope = this;

        console.log("save existing player here...");

        existingPlayer.name = currentScope.name;
        existingPlayer.email = currentScope.email;
        existingPlayer.password = currentScope.password;

        this.statusMessage = "Updating profile information";

        cloudDataPlayer.save(existingPlayer)
            .then(function (playerObject) {
                console.log("saved player " + playerObject.name);

                currentScope.$apply(function () {
                    currentScope.statusMessage = "Profile updated.";
                });
            },
                function (err) {
                    console.log("error adding player " + err);
                });
    };

};
