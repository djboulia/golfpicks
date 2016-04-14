// TODO: put this in a common function
var mergeScoresAndPlayers = function (roundid, event) {
    
    var scores = [];

    if (event.rounds[roundid].scores.length == 0) {

        // no prior score, just put in an empty set
        for (var i = 0; i < event.players.length; i++) {
            var player = event.players[i];

            scores.push({
                player: player,
                score: ""
            });
        }

    } else {

        // put all of our players into a hash map
        var players = {};

        for (var i = 0; i < event.players.length; i++) {
            var player = event.players[i];

            players[player.user._id] = player;
        }

        //
        // eachs score consists of a score and a player field
        // the player field points to an objectId of a player
        // we fluff up scores with players
        //

        for (var i = 0; i < event.rounds[roundid].scores.length; i++) {
            var score = event.rounds[roundid].scores[i];

            scores.push({
                player: players[score.player],
                score: score.score
            });
        }
    }
    
    return scores;
}

angular.module('GolfPicks')
    .controller('RoundCtrl', ['$scope', '$stateParams', '$cookieStore',
                               'cloudDataEvent', 'cloudDataPlayer',
                               'cloudDataCourse', RoundCtrl]);


function RoundCtrl($scope, $stateParams, $cookieStore,
    cloudDataEvent, cloudDataPlayer, cloudDataCourse) {

    console.log("reached round controller with id " +
        $stateParams.id + " and round id " + $stateParams.roundid);

    var returnUrl = "#/eventdetails/id/" + $stateParams.id;
    var event = undefined;
    var roundid = parseInt($stateParams.roundid);

    $scope.formatDate = function (strDate) {
        var date = new Date(strDate);
        return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear()
    };

    if ($stateParams.id) {
        // load up the existing data in our form

        cloudDataEvent.get($stateParams.id, {
            success: function (obj) {
                event = obj;

                var scores = mergeScoresAndPlayers(roundid, event);

                $scope.$apply(function () {
                    $scope.title = "Round " + (roundid + 1);
                    $scope.roundid = roundid;
                    $scope.course = event.rounds[roundid].course.name;
                    $scope.name = event.name;
                    $scope.date = event.rounds[roundid].date;
                    $scope.rounds = event.rounds;
                    $scope.scores = scores;
                    $scope.existingEvent = true;
                });

            },
            error: function (err) {
                console.log("error getting event: " + err);
            }
        });
    }



    $scope.submit = function () {

        if (event) {
            console.log("save existing event here...");

            //
            // put the scores back in the object before saving
            //
            var scores = [];

            for (var i = 0; i < $scope.scores.length; i++) {
                var score = $scope.scores[i];

                scores.push({
                    player: score.player.user._id,
                    score: score.score
                });
            }

            event.rounds[roundid].scores = scores;

            cloudDataEvent.save(event, {
                success: function (obj) {
                    console.log("saved event " + obj.name);

                    // switch to players page
                    window.location.href = returnUrl;
                },
                error: function (err) {
                    console.log("error adding event: " + err);
                }
            });
        }

    };

};