angular.module('GolfPicks', 
               ['ui.bootstrap', 'ui.router', 
                'ngCookies', 'ngRoute', 'ngSanitize', 'lbServices',
                'GolfPicks.cloud', 'GolfPicks.data', 'GolfPicks.weatherData', 'GolfPicks.mapWidget',
                'GolfPicks.gameData', 'GolfPicks.gameUtils', 'GolfPicks.eventUtils'])
        .run(run);

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http', 'cloudDataCurrentUser'];
    
    function run($rootScope, $location, $cookieStore, $http, currentUser) {

        console.log("in run!");
        
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            
            if (!currentUser.isLoggedIn()) {
                console.log("not logged in, redirecting");
                $location.path('/login');
            } else {
                console.log("logged in, going to normal processing");
            }
        });
    }
