'use strict';

/**
 * Route configuration for the RDash module.
 */
angular.module('GolfPicks').config(['$stateProvider', '$routeProvider', '$urlRouterProvider',
    function ($stateProvider, $routeProvider, $urlRouterProvider) {

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'templates/games.html',
                label: 'My Games',
                crumbs: 'Home / My Games'
            })
            .state('allgames', {
                url: '/allgames',
                templateUrl: 'templates/allgames.html',
                label: 'Games',
                crumbs: 'Home / Games'
            })
            .state('gameplayers', {
                url: '/gameplayers/id/:id',
                templateUrl: 'templates/gameplayers.html',
                label: 'Games',
                crumbs: 'Home / Games / Game Players'
            })
            .state('about', {
                url: '/about',
                templateUrl: 'templates/about.html',
                label: 'About',
                crumbs: 'Home / About'
            })
            .state('support', {
                url: '/support',
                templateUrl: 'templates/support.html',
                label: 'Support',
                crumbs: 'Home / Support'
            })
            .state('leaderboard/id', {
                url: '/leaderboard/id/:id',
                templateUrl: 'templates/leaderboard.html',
                label: 'Leaderboard',
                crumbs: 'Home / Games / Leaderboard'
            })
            .state('eventleaders/id', {
                url: '/eventleaders/id/:id',
                templateUrl: 'templates/eventleaders.html',
                label: 'Tournament Leaders',
                crumbs: 'Home / Golf Tournaments / Tournament Leaders'
            })
            .state('picks/id', {
                url: '/picks/id/:id',
                templateUrl: 'templates/picks.html',
                label: 'Picks',
                crumbs: 'Home / Games / Picks'
            })
            .state('profile', {
                url: '/profile',
                templateUrl: 'templates/profile.html',
                label: 'Profile',
                crumbs: 'Home / Profile'
            })
            .state('events', {
                url: '/events',
                templateUrl: 'templates/events.html',
                label: 'Golf Tournament',
                crumbs: 'Home / Golf Tournament'
            })
            .state('event', {
                url: '/event',
                templateUrl: 'templates/event.html',
                label: 'Tournament',
                crumbs: 'Home / Golf Tournaments / Tournament'
            })
            .state('event/id', {
                url: '/event/id/:id',
                templateUrl: 'templates/event.html',
                label: 'Tournament',
                crumbs: 'Home / Golf Tournaments / Tournament'
            })
            .state('eventdetails/id', {
                url: '/eventdetails/id/:id',
                templateUrl: 'templates/eventdetails.html',
                label: 'Tournament Details',
                crumbs: 'Home / Golf Tournaments / Tournament Details'
            })
            .state('eventdetails/id/round', {
                url: '/eventdetails/id/round/:id/:roundid',
                templateUrl: 'templates/round.html',
                label: 'Round',
                crumbs: 'Home / Golf Tournament / Tournament / Round'
            })
            .state('round', {
                url: '/round',
                templateUrl: 'templates/round.html',
                label: 'Round Detail',
                crumbs: 'Home / Round'
            })
            .state('scores', {
                url: '/scores',
                templateUrl: 'templates/scores.html',
                label: 'Scores',
                crumbs: 'Home / Scores'
            })
            .state('score', {
                url: '/score',
                templateUrl: 'templates/score.html',
                label: 'Score',
                crumbs: 'Home / Scores / Score'
            })
            .state('scoreedit', {
                url: '/scoreedit',
                templateUrl: 'templates/scoreedit.html',
                label: 'Score',
                crumbs: 'Home / Scores / Score'
            })
            .state('users', {
                url: '/users',
                templateUrl: 'templates/users.html',
                label: 'Users',
                crumbs: 'Home / Users'
            })
            .state('user/id', {
                url: '/user/id/:id',
                templateUrl: 'templates/user.html',
                label: 'User',
                crumbs: 'Home / Users / User'
            })
            .state('user', {
                url: '/user',
                templateUrl: 'templates/user.html',
                label: 'User',
                crumbs: 'Home / Users / User'
            })
            .state('courses', {
                url: '/courses',
                templateUrl: 'templates/courses.html',
                label: 'Courses',
                crumbs: 'Home / Courses'
            })
            .state('course', {
                url: '/course',
                templateUrl: 'templates/course.html',
                label: 'Course',
                crumbs: 'Home / Courses / Course'
            })
            .state('course/id', {
                url: '/course/id/:id',
                templateUrl: 'templates/course.html',
                label: 'Course',
                crumbs: 'Home / Courses / Course'
            })
            .state('coursedetails/id', {
                url: '/coursedetails/id/:id',
                templateUrl: 'templates/coursedetails.html',
                label: 'Course Details',
                crumbs: 'Home / Courses / Course Details'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                label: 'GolfPicks',
                crumbs: ''
            });

    }
]);
