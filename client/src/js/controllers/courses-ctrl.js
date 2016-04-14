angular.module('GolfPicks')
    .controller('CoursesCtrl', ['$scope', '$cookieStore', 'cloudDataCourse', CoursesCtrl]);


function CoursesCtrl($scope, $cookieStore, cloudDataCourse) {
    var editUrl = '#/course';
    var detailsUrl = '#/coursedetails';

    console.log("reached courses controller!");

    $scope.editUrl = editUrl;
    $scope.detailsUrl = detailsUrl;

    cloudDataCourse.getAll( {
        success: function (courses) {
            $scope.$apply(function () {
                $scope.courses = courses;
            });
        },
        error: function (err) {
            console.log("error");
        }
    });


};