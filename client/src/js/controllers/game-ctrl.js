angular.module('GolfPicks')
    .controller('GameCtrl', ['$scope', '$stateParams', '$uibModal', '$cookieStore', 'cloudDataGame', 'cloudDataEvent', 'cloudDataCourse', GameCtrl]);


function GameCtrl($scope, $stateParams, $uibModal, $cookieStore, cloudDataGame, cloudDataEvent, cloudDataCourse) {
    var returnUrl = "#/allgames";

    console.log("reached game controller with id " + $stateParams.id);

    var majors = [
        {
            name: "The Masters",
            provider: 'pga',
            baseurl: "masters-tournament",
            id: "014"
        },
        {
            name: "The U.S. Open",
            provider: 'pga',
            baseurl: "us-open",
            id: "026"
        },
        {
            name: "The Open Championship",
            provider: 'pga',
            baseurl: "the-open-championship",
            id: "100"
        },
        {
            name: "The PGA Championship",
            provider: 'golfchannel',
            baseurl: "pga-championship",
            id: "pga-of-america"
        }
    ];

    var existingGame = undefined;
    var existingEvent = undefined;

    var findTournament = function (event) {
        var major = undefined;

        console.log("looking for major " + event.baseurl);

        for (var i = 0; i < majors.length; i++) {
            if (majors[i].baseurl == event.baseurl) {
                major = majors[i];
                break;
            }
        }

        return major;
    };

    var findCourse = function (event, courses) {
        var course = undefined;

        if (event.rounds.length > 0) {
            var courseid = event.rounds[0].course._id;

            console.log("looking for courseid " + JSON.stringify(courseid));

            for (var i = 0; i < courses.length; i++) {
                //                console.log("found course: " + JSON.stringify(courses[i]));

                if (courses[i]._id == courseid) {
                    course = courses[i];
                    break;
                }
            }
        }

        return course;
    };

    $scope.popup = {
        start: false,
        end: false
    };

    $scope.openPopup = function (selected) {
        $scope.popup[selected] = true;
    };

    $scope.dateOptions = {};

    $scope.startChanged = function () {
        console.log("start:", this.start);
        this.end = this.start;
        this.dateOptions.minDate = this.start;
    };

    $scope.dateFormat = "MMM dd ',' yyyy";
    $scope.altInputFormats = ['M!/d!/yyyy'];

    if ($stateParams.id) {
        // load up the existing data in our form
        $scope.title = "Update Game";

        cloudDataGame.get($stateParams.id)
            .then(function (obj) {
                existingGame = obj;

                $scope.name = existingGame.name;
                $scope.start = new Date(existingGame.start);
                $scope.end = new Date(existingGame.end);
                $scope.existingGame = true;

                console.log("getting event info for id " + existingGame.event);

                return cloudDataEvent.get(existingGame.eventid); // promise
            })
            .then(function (event) {

                existingEvent = event;

                $scope.majors = majors;
                $scope.major = findTournament(existingEvent);

                return cloudDataCourse.getAll(); //promise
            })
            .then(function (courses) {

                $scope.courses = courses;
                $scope.course = findCourse(existingEvent, courses);

                $scope.loaded = true;
            })
            .catch(function (err) {
                console.log("error getting game " + err);
            });
    } else {
        $scope.title = "New Game";

        // load up the default data structures
        $scope.name = "";
        $scope.start = "";
        $scope.end = "";

        $scope.majors = majors;

        cloudDataCourse.getAll()
            .then(function (courses) {
                    $scope.courses = courses;
                    $scope.loaded = true;
                },
                function (err) {
                    console.log("error getting courses " + err);
                });

    }


    $scope.submit = function () {

        var getRounds = function (start, end, course) {
            var rounds = [];

            // put in the course id for each round of the tournament
            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            var days = Math.round(Math.abs((start.getTime() - end.getTime()) / (oneDay))) + 1;

            var currentDay = new Date(start.getTime());

            for (var i = 0; i < days; i++) {
                var round = {
                    course: course,
                    date: currentDay
                };

                rounds.push(round);

                // move to next day
                currentDay = new Date(currentDay.getTime());
                currentDay.setDate(currentDay.getDate() + 1);
            }

            return rounds;
        }

        var self = this;

        if (existingGame) {
            console.log("saving existing game...");

            existingGame.name = self.name;
            existingGame.start = self.start;
            existingGame.end = self.end;

            // TODO: these saves could happen in parallel
            cloudDataGame.save(existingGame)
                .then(function (obj) {
                    console.log("saved game " + obj.name);

                    // now save the event information
                    existingEvent.name = self.name;
                    existingEvent.start = self.start;
                    existingEvent.end = self.end;
                    existingEvent.scoreType = "pga-live-scoring";
                    existingEvent.provider = self.major.provider;
                    existingEvent.baseurl = self.major.baseurl;
                    existingEvent.rounds = [];

                    if (existingEvent.provider == 'pga') {
                        existingEvent.tournament_id = self.major.id;
                    } else {
                        existingEvent.tour = self.major.id;
                    }

                    existingEvent.rounds = getRounds(self.start, self.end, self.course);

                    return cloudDataEvent.save(existingEvent); // promise
                })
                .then(function (event) {
                    console.log("saved event " + event.name);

                    // return to main page
                    window.location.href = returnUrl;
                })
                .catch(
                    function (err) {
                        console.log("error adding game " + err);
                    });

        } else {

            // add event first since, we need this reference for the Game
            var event = {
                name: self.name,
                start: self.start,
                end: self.end,
                scoreType: "pga-live-scoring",
                provider: self.major.provider,
                baseurl: self.major.baseurl,
                rounds: []
            };

            if (event.provider == 'pga') {
                event.tournament_id = self.major.id;
            } else {
                event.tour = self.major.id;
            }

            event.rounds = getRounds(self.start, self.end, self.course);

            console.log("Saving event " + event.name);

            cloudDataEvent.add(event)
                .then(function (event) {

                    console.log("saved event " + event.name + " with id " + event._id);

                    // now add our game record, which points to the event we
                    // just created prior
                    var game = {
                        eventid: event._id,
                        name: self.name,
                        start: self.start,
                        end: self.end,
                        gamers: []
                    };

                    return cloudDataGame.add(game); //promise
                })
                .then(function (game) {
                    console.log("saved game " + game.name + " with id " + game._id);

                    // switch to picks page
                    window.location.href = returnUrl;
                })
                .catch(function (err) {
                    console.log("error adding game " + err);
                });
        }

    };

    $scope.delete = function () {

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'deleteGame.html',
            controller: 'ModalGameDeleteCtrl',
            resolve: {
                game: function () {
                    return existingGame;
                }
            }
        });

        modalInstance.result.then(function (course) {
            console.log("Deleting game " + game.name);
            cloudDataCourse.delete(course)
                .then(function (obj) {
                        console.log("delete successful");

                        // switch to players page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error from delete : " + err);
                    });

        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

};

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('GolfPicks')
    .controller('ModalGameDeleteCtrl', ['$scope', '$uibModalInstance', 'course', ModalGameDeleteCtrl]);

function ModalGameDeleteCtrl($scope, $uibModalInstance, game) {
    $scope.game = game;

    $scope.ok = function () {
        $uibModalInstance.close(game);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}
