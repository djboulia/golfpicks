angular.module('GolfPicks')
    .controller('EventCtrl', ['$scope', '$stateParams',
                               '$uibModal', '$cookieStore',
                               'cloudDataCurrentUser', 'cloudDataEvent', 'cloudDataPlayer',
                               'gameData', 'mapWidget', EventCtrl]);

function EventCtrl($scope, $stateParams, $uibModal, $cookieStore,
    currentUser, cloudDataEvent, cloudDataPlayer, gameData, mapWidget) {
    var returnUrl = "#";
    var courseUrl = "#/coursedetails";
    var editRoundUrl = "#/eventdetails/id/round/" + $stateParams.id;
    var eventLeaderUrl = "#/eventleaders/id/" + $stateParams.id;

    console.log("reached event controller with id " + $stateParams.id);

    var event = undefined;
    var datePickerOptions = {
        startopen: false,
        endopen: false,
        format: 'dd-MMMM-yyyy'
    };

    // TODO: fix this for non PGA events
    var isPGA = true;

    $scope.editable = (isPGA) ? false : currentUser.isAdmin();
    $scope.courseUrl = courseUrl;
    $scope.editRoundUrl = editRoundUrl;
    $scope.eventLeaderUrl = eventLeaderUrl;

    $scope.formatDate = function (strDate) {
        var date = new Date(strDate);
        return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear()
    };

    $scope.datePickerOptions = datePickerOptions;
    $scope.title = "New Event";
    $scope.start = new Date();
    $scope.end = new Date();

    if ($stateParams.id) {
        // load up the existing data in our form

        gameData.loadRankedPlayers($stateParams.id)
            .then(function (result) {
                    var event = result.event;
                    var golfers = result.golfers;

                    $scope.title = "Update Event";
                    $scope.name = event.name;
                    $scope.start = event.start;
                    $scope.end = event.end;
                    $scope.players = golfers;
                    $scope.rounds = event.rounds;
                    $scope.existingEvent = true;

                    insertMap(event.rounds);

                },
                function (err) {
                    console.log("error getting event: " + err);
                });
    }

    $scope.startopen = function ($event) {
        console.log("calling startopen().  current state is " +
            $scope.datePickerOptions.startopen);

        $scope.datePickerOptions.startopen = true;
    };

    $scope.endopen = function ($event) {
        console.log("calling endopen().  current state is " +
            $scope.datePickerOptions.endopen);

        $scope.datePickerOptions.endopen = true;
    };

    $scope.formatDate = function (strDate) {
        var date = new Date(strDate);
        return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear()
    };



    $scope.submit = function () {

        if (event) {
            console.log("save existing event here...");

            event.name = this.name;
            event.start = this.start;
            event.end = this.end;

            cloudDataPlayer.save(event)
                .then(function (obj) {
                        console.log("saved event " + obj.name);

                        // switch to players page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error adding event: " + err);
                    });
        } else {
            var event = {
                name: this.name,
                start: this.start,
                end: this.end
            };

            console.log("save player " + event.name + " here");

            cloudDataEvent.add(event)
                .then(function (obj) {
                        console.log("saved event " + obj.name);

                        // switch to picks page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error adding event " + err);
                    });
        }

    };

    $scope.delete = function () {

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'deleteEvent.html',
            controller: 'ModalEventDeleteCtrl',
            resolve: {
                event: function () {
                    return event;
                }
            }
        });

        modalInstance.result.then(function (event) {
            console.log("Deleting event " + event.name);
            cloudDataEvent.delete(event)
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


    //
    // google map with pins at course locations
    //
    var insertMap = function (rounds) {
        var map;

        if (document.getElementById('map')) {

            var bounds = undefined;

            // build out our bounding box for this map based on locations of courses
            // for PGA events, the course stays the same for all rounds
            // for non-PGA events, the course could change each day
            //
            // TODO: fix for non PGA
            var isPGA = true;

            if (!isPGA) {

                for (var i = 0; i < rounds.length; i++) {

                    if (rounds[i].course.location) {
                        var location = new google.maps.LatLng(rounds[i].course.location.lat, rounds[i].course.location.lng);

                        if (!bounds) {
                            bounds = new google.maps.LatLngBounds(location, location);
                        } else {
                            bounds = bounds.extend(location);
                        }
                    }
                }

                map = new google.maps.Map(document.getElementById('map'), {
                    center: bounds.getCenter(),
                    zoom: 15
                });

                map.fitBounds(bounds);


                for (var i = 0; i < rounds.length; i++) {
                    var location = rounds[i].course.location;

                    if (location) {
                        var label = String(i + 1);

                        mapWidget.addCourseMarker(label, rounds[i].course, map);
                    }
                }

            } else {
                var location = rounds[0].course.location;

                if (location) {
                    map = mapWidget.create('map', location);

                    var label = "1-4";

                    mapWidget.addCourseMarker(label, rounds[0].course, map);
                }

            }
        }
    };


};

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('GolfPicks')
    .controller('ModalEventDeleteCtrl', ['$scope', '$uibModalInstance', 'player', ModalEventDeleteCtrl]);

function ModalEventDeleteCtrl($scope, $uibModalInstance, event) {
    $scope.event = event;

    $scope.ok = function () {
        $uibModalInstance.close(event);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}
