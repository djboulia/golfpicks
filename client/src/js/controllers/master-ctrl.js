/**
 * Master Controller
 */

angular.module('GolfPicks')
    .controller('MasterCtrl', ['$scope', '$cookieStore','$location',  
                               '$rootScope', 'cloudDataCurrentUser', 'cloudDataLog', MasterCtrl]);

var loginUrl = "/#/login";

var initCurrentUser = function ($scope, $location, currentUser) {

    $scope.loggedIn = currentUser.isLoggedIn();    
    $scope.username = currentUser.getDisplayName();
    $scope.admin = currentUser.isAdmin();
    $scope.logOut = function () {
        currentUser.logOut();
        window.location.href = loginUrl;
//        $location.path(loginUrl);
    };

    return true;
};

function MasterCtrl($scope, $cookieStore, $location, $rootScope, currentUser, cloudLog) {

    if (!initCurrentUser($scope, $location, currentUser)) {
        return;
    }

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

}