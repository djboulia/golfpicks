angular.module('GolfPicks')
    .controller('EventLeadersCtrl', ['$scope', '$stateParams', '$location',
        'gameData', EventLeadersCtrl]);


function EventLeadersCtrl($scope, $stateParams, $location, gameData) {

    $scope.courseUrl = "coursedetails";

    $scope.loadItems = function () {

        $scope.statusMessage = "Loading...";

        // if testingMode is a url parameter, turn off some of the date/rule checking
        var testingMode = $location.search().testingMode ? true : false;
        console.log("testingMode is set to " + testingMode);

        // if debugMode is a url parameter, write more info to the log
        var debugMode = $location.search().debugMode ? true : false;

        // called when we've loaded initial game data
        var eventLoadedHandler = function (eventid) {

            // load the current event associated with this game
            // the EVENT holds the golfers
            // the GAME is the game played based on the golfer's scores

            gameData.loadEventLeaders(eventid)
                .then(function (result) {
                    const name = result.name;
                    const courseInfo = result.courseInfo;
                    const golfers = result.golfers;
                    const roundNumbers = result.roundNumbers;
                    const lowRounds = result.lowRounds;

                    $scope.name = name;
                    $scope.courseInfo = courseInfo;
                    $scope.golfers = golfers;
                    $scope.roundNumbers = roundNumbers;
                    $scope.lowRounds = lowRounds;
                    $scope.eventOverviewUrl = "#/eventdetails/id/" + eventid;

                    $scope.loaded = true;

                },
                    function (err) {
                        // The object was not retrieved successfully.
                        console.error("Couldn't access event information!");

                        $scope.$apply(function () {
                            $scope.errorMessage = "Couldn't access event information!";
                        });
                    });
        }

        var eventid = $stateParams.id;

        if (eventid) {
            eventLoadedHandler(eventid);
        } else {
            console.log("error! no eventid specified!");
            $scope.errorMessage = "error! no eventid specified!";
        }

    }

    $scope.onRefresh = function () {
        console.log("Refreshing event leaders");

        // Go back to the Cloud and load a new set of Objects 
        // as a hard refresh has been done
        $scope.loadItems();

        // set the timeout interval to refresh every 5 minutes
        var REFRESH_MINUTES = 5;

        setTimeout($scope.onRefresh, REFRESH_MINUTES * 1000 * 60);
    };

    $scope.onRefresh();
};
