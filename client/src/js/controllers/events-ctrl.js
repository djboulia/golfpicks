angular.module('GolfPicks')
    .controller('EventsCtrl', ['$scope', '$cookieStore', 'cloudDataEvent', EventsCtrl]);
var eventUrl = '#/round';

function EventsCtrl($scope, $cookieStore, cloudDataEvent) {

    var editUrl = '#/event';
    var detailsUrl = '#/eventdetails';

    console.log("reached events controller!");

    $scope.editUrl = editUrl;
    $scope.detailsUrl = detailsUrl;

    $scope.formatDate = function (strDate) {
        var date = new Date(strDate);
        return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear()
    };

    cloudDataEvent.getAll({
        success: function (events) {

            events.sort(function (a, b) {
                if (a.start == b.start) {
                    return 0;
                } else {
                    return (a.start > b.start) ? -1 : 1;
                }
            });
            
            $scope.$apply(function () {
                $scope.events = events;
            });
        },
        error: function (err) {
            console.log("error");
        }
    });

};