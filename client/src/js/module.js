angular.module('GolfPicks',
    ['ui.bootstrap', 'ui.router',
        'ngCookies', 'ngRoute', 'ngSanitize', 'ngAria', 'ngMaterial', 'GolfPicks.serverApi',
        'GolfPicks.cloud', 'GolfPicks.data', 'GolfPicks.mapWidget',
        'GolfPicks.gameData', 'GolfPicks.gameUtils', 'GolfPicks.eventUtils'])
    .run(run);

run.$inject = ['$q', '$rootScope', '$location', 'cloudDataCurrentUser'];

function run($q, $rootScope, $location, currentUser) {

    console.log("in run!");

    var redirect = function () {
        console.log("not logged in, redirecting");
        $location.path('/login');
    }

    $rootScope.$on('$locationChangeStart', function (event, next, current) {

        var deferred = $q.defer();

        if (currentUser) {
            currentUser.isLoggedIn()
                .then(function (result) {
                    if (result) {
                        console.log("logged in, going to normal processing");
                        deferred.resolve(true);
                    } else {
                        redirect();
                        deferred.reject(false);
                    }
                },
                    function (err) {
                        console.log("error getting user ", err);
                        redirect();
                        deferred.reject(false);
                    });
        } else {
            redirect();
            deferred.reject(false);
        }
        return deferred.promise;
    });
}

