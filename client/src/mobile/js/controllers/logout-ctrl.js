console.log("logout");

angular.module('GolfPicksMobile')

// Handle logout of a user
.controller('LogoutCtrl', function($rootScope, $scope, $state, 
                                    cloudDataCurrentUser, gameDataCache) {

    console.log("logging out");
    
    cloudDataCurrentUser.logOut();

    // clear the cache on logout
    gameDataCache.clearAll();

    // switch to index page
    $state.go("login");

});
