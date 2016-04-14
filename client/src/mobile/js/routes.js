console.log("routes!");

angular.module('GolfPicksMobile')

.config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // setup an abstract state for the tabs directive
        .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html"
    })

    // the pet tab has its own child nav-view and history
    .state('tab.list-index', {
        url: '/list',
        views: {
            'list-tab': {
                templateUrl: 'templates/history.html',
                controller: 'HistoryCtrl'
            }
        }
    })

    .state('tab.about', {
        url: '/about',
        views: {
            'about-tab': {
                templateUrl: 'templates/about.html',
            }
        }
    })

    .state('tab.leaderboard', {
        url: "/leaderboard/{eventid}",
        views: {
            'list-tab': {
                templateUrl: 'templates/leaderboard.html',
                controller: 'LeaderboardCtrl'
            }
        }
    })

    .state('tab.gamer', {
        url: "/gamer/{eventid}/{gamer}",
        views: {
            'list-tab': {
                templateUrl: 'templates/gamer.html',
                controller: 'GamerCtrl'
            }
        }
    })

    .state('login', {
        url: "/login",
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
    })

    .state('logout', {
        url: "/logout",
        templateUrl: 'templates/logout.html',
        controller: 'LogoutCtrl'
    })

    .state('picks', {
        url: "/picks/{eventid}",
        templateUrl: 'templates/picks.html',
        controller: 'PicksCtrl'
    })

    .state('picks.rules', {
        url: '/rules',
        views: {
            'rules': {
                templateUrl: 'templates/rules.html'
            }
        }
    });



    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/list');

});