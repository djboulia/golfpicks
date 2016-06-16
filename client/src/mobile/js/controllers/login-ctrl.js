console.log("login");

angular.module('GolfPicksMobile')

// Handle login of a user
.controller('LoginCtrl', function ($rootScope, $scope, $state,
    cloudDataCurrentUser, gameDataCache) {

    // initialize the bound variables here.  if we don't initialize these up front
    // then the input values don't get bound properly. 
    // http://stackoverflow.com/questions/24027497/phonegap-ionic-scope-inside-of-click-function-not-updating

    $scope.statusMessage = "";
    $scope.input = {
        username: "",
        password: ""
    };

    console.log("defining submit function");
    $scope.submit = function () {

        // clear the cache on login
        gameDataCache.clearAll();

        var user = $scope.input.username;
        var pass = $scope.input.password;

        $scope.statusMessage = "Logging in user " + user;

        // update this person's picks in the game data
        cloudDataCurrentUser.logIn(user, pass)
            .then(function (user) {
                    $scope.statusMessage = "";

                    // switch to index page
                    $state.go(pages.postLoginUrl);
                },
                function (reason) {
                    console.log("login failed: " + reason);

                    // The login failed. Check error to see why.
                    $scope.statusMessage = "Login failed.  Try a different userid or password.";
                });

    }


});
