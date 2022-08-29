angular.module('GolfPicks', 
               ['ui.bootstrap', 'ui.router', 
                'ngCookies', 'ngRoute', 'ngSanitize', 'ngAria', 'ngMaterial', 'GolfPicks.serverApi',
                'GolfPicks.cloud', 'GolfPicks.data', 'GolfPicks.mapWidget',
                'GolfPicks.gameData', 'GolfPicks.gameUtils', 'GolfPicks.eventUtils'])
        .run(run);

    run.$inject = ['$rootScope', '$location', 'cloudDataCurrentUser'];
    
    function run($rootScope, $location, currentUser) {

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
