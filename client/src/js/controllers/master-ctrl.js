/**
 * Master Controller
 */


angular.module('GolfPicks')
    .controller('MasterCtrl', ['$q', '$scope', '$cookieStore', '$location',
        '$rootScope', 'cloudDataCurrentUser', 'cloudDataLog', MasterCtrl]);

var loginUrl = "/#/login";

var initCurrentUser = function ($q, $scope, currentUser) {
    var deferred = $q.defer();

    if (currentUser) {
        currentUser.isLoggedIn()
            .then(function (result) {
                console.log('got result! ', result);
                console.log('currentUser ', currentUser);

                if (result) {
                    $scope.loggedIn = true;
                    $scope.username = currentUser.getDisplayName();
                    $scope.admin = currentUser.isAdmin();

                    console.log('username',  $scope.username);

                    $scope.logOut = function () {
                        currentUser.logOut();
                        window.location.href = loginUrl;
                        //        $location.path(loginUrl);
                    };

                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                }
            },
                function (err) {
                    console.log("error getting user " + err);
                    deferred.reject(false);
                });

    } else {
        deferred.reject(false);
    }

    return deferred.promise;
};

function MasterCtrl($q, $scope, $cookieStore, $location, $rootScope, currentUser, cloudLog) {

    initCurrentUser($q, $scope, currentUser)
        .then(function () {

            //
            // track our state changes and update the bread crumbs/title as we change views
            //
            $rootScope.$on('$stateChangeStart',
                function (event, toState, toParams, fromState, fromParams) {
                    console.log("toState: " + toState.label);
                    $scope.title = toState.label;
                    $scope.crumbs = toState.crumbs;
                });

            //
            // write to the log to record access at each state change
            //
            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    cloudLog.access($location.path());
                });

            //
            // Sidebar Toggle & Cookie Control
            //
            var mobileView = 992;

            $scope.getWidth = function () {
                return window.innerWidth;
            };

            $scope.$watch($scope.getWidth, function (newValue, oldValue) {
                if (newValue >= mobileView) {
                    if (angular.isDefined($cookieStore.get('toggle'))) {
                        $scope.toggle = !$cookieStore.get('toggle') ? false : true;
                    } else {
                        $scope.toggle = true;
                    }
                } else {
                    $scope.toggle = false;
                }

            });

            $scope.toggleSidebar = function () {
                $scope.toggle = !$scope.toggle;
                $cookieStore.put('toggle', $scope.toggle);
            };

            window.onresize = function () {
                $scope.$apply();
            };
        },
            function (err) {
                console.log('no current user found');
                window.location.href = loginUrl;
            });

}
