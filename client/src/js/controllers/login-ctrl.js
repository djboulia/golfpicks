angular.module('GolfPicks')
    .controller('LoginCtrl', ['$scope', '$cookieStore',
                              'cloudDataCurrentUser', '$location', 'Alerts', LoginCtrl]);

var mainUrl = "/index";

function LoginCtrl($scope, $cookieStore, currentUser, $location, Alerts) {

    $scope.username = "";
    $scope.password = "";

    console.log("defining submit function");

    $scope.submit = function () {

        var user = this.username;
        var pass = this.password;

        $scope.errorMessage = "Logging in user " + user;

        currentUser.logIn(user, pass)
            .then(function (user) {
                    $scope.errorMessage = "";

                    // switch to picks page
                    console.log("Logged in, switching to " + mainUrl);
                    //                $location.path(mainUrl);
                    window.location.href = "index.html";
                    return true;
                },
                function (reason) {

                    // The login failed. Check error to see why.
                    $scope.errorMessage = "Login failed.  Try a different userid or password.";
                });
    }

    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;

    $scope.getWidth = function () {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function (newValue, oldValue) {
        if (angular.isDefined($cookieStore.get('toggle'))) {
            $scope.toggle = !$cookieStore.get('toggle') ? false : true;
        } else {
            $scope.toggle = true;
        }
    });

    window.onresize = function () {
        $scope.$apply();
    };

}
