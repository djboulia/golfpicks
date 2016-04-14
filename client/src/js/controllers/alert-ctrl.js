/**
 * Alerts Controller
 */

angular.module('GolfPicks').factory('Alerts', function() {
    var alerts = {};
    
    alerts.list = [];
    
    alerts.addSuccessAlert = function(str) {
            alerts.list.push({
                msg: str,
                type: 'success'
            });
            console.log('alerts' + JSON.stringify(alerts.list));
    };

    alerts.addDangerAlert = function(str) {
            alerts.list.push({
                msg: str,
                type: 'danger'
            });
            console.log('alerts' + JSON.stringify(alerts.list));
    };

    alerts.clearAlerts = function() {
            alerts.list = [];
            console.log('alerts' + JSON.stringify(alerts.list));
    };

    alerts.closeAlert = function(index) {
            alerts.list.splice(index, 1);
    };
        
    return alerts;
});

angular.module('GolfPicks')
    .controller('AlertsCtrl', ['$scope', 'Alerts', AlertsCtrl]);

function AlertsCtrl($scope, Alerts) {
    $scope.alerts = Alerts;    
}