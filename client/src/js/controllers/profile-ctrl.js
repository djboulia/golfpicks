angular.module('GolfPicks')
    .controller('ProfileCtrl', ['$scope', '$stateParams','$cookieStore',
                               'cloudDataCurrentUser','cloudDataPlayer', ProfileCtrl]);


function ProfileCtrl($scope, $stateParams, $cookieStore, 
                      currentUser, cloudDataPlayer) {

    console.log("reached profile controller");
    
    var existingPlayer = undefined;

    // load up the existing data in our form
    $scope.title = "Update Profile";

    cloudDataPlayer.get(currentUser.getId(), {
        success: function (playerObject) {
            existingPlayer = playerObject;

            $scope.name = existingPlayer.name;
            $scope.email = existingPlayer.email;
            $scope.password = existingPlayer.password;
            $scope.existingPlayer = true;
        },
        error: function (err) {
            console.log("error getting user " + err);
        }
    });

    $scope.submit = function () {

        var currentScope = this;
        
        console.log("save existing player here...");

        existingPlayer.name = currentScope.name;
        existingPlayer.email = currentScope.email;
        existingPlayer.password = currentScope.password;
        
        this.statusMessage = "Updating profile information";

        cloudDataPlayer.save(existingPlayer, {
            success: function (playerObject) {
                console.log("saved player " + playerObject.name);

                currentScope.$apply( function() {
                    currentScope.statusMessage = "Profile updated.";
                });
            },
            error: function (err) {
                console.log("error adding player " + err);
            }
        });

    };

};
