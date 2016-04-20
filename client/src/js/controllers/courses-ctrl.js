angular.module('GolfPicks')
    .controller('CoursesCtrl', ['$scope', '$cookieStore', 'cloudDataCourse', CoursesCtrl]);


function CoursesCtrl($scope, $cookieStore, cloudDataCourse) {
    var editUrl = '#/course';
    var detailsUrl = '#/coursedetails';

    console.log("reached courses controller!");

    $scope.editUrl = editUrl;
    $scope.detailsUrl = detailsUrl;

    cloudDataCourse.getAll()
        .then(function (courses) {
                $scope.courses = courses;
            },
            function (err) {
                console.log("error");
            });
};
