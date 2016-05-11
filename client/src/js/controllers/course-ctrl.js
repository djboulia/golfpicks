angular.module('GolfPicks')
    .controller('CourseCtrl', ['$scope', '$stateParams', '$uibModal', '$cookieStore', 'cloudDataCourse', CourseCtrl]);

var initializeHoleData = function () {
    return [{
            number: 1
            }, {
            number: 2
            }, {
            number: 3
            }, {
            number: 4
            }, {
            number: 5
            }, {
            number: 6
            }, {
            number: 7
            }, {
            number: 8
            }, {
            number: 9
            }, {
            number: 10
            }, {
            number: 11
            }, {
            number: 12
            }, {
            number: 13
            }, {
            number: 14
            }, {
            number: 15
            }, {
            number: 16
            }, {
            number: 17
            }, {
            number: 18
            }
        ];
};

function CourseCtrl($scope, $stateParams, $uibModal, $cookieStore, cloudDataCourse) {
    var returnUrl = "#/courses";

    console.log("reached course controller with id " + $stateParams.id);

    var existingCourse = undefined;

    if ($stateParams.id) {
        // load up the existing data in our form
        $scope.title = "Update Course";

        cloudDataCourse.get($stateParams.id)
            .then(function (obj) {
                    existingCourse = obj;

                    $scope.name = existingCourse.name;
                    $scope.tee = existingCourse.tee;
                    $scope.par = existingCourse.par;
                    $scope.yardage = existingCourse.yardage;
                    $scope.slope = existingCourse.slope;
                    $scope.rating = existingCourse.rating;
                    $scope.location = existingCourse.location;
                    $scope.holes = existingCourse.holes || initializeHoleData();
                    $scope.existingCourse = true;
                    $scope.loaded = true;
                },
                function (err) {
                    console.log("error getting course " + err);
                });
    } else {
        $scope.title = "New Course";

        // load up the default data structures
        $scope.name = "";
        $scope.tee = "";
        $scope.location = {};
        $scope.holes = initializeHoleData();
        $scope.loaded = true;
    }

    $scope.submit = function () {

        console.log("Saving " + JSON.stringify($scope.holes));

        // calculate the par and yardage
        var holes = $scope.holes;
        var yardage = 0;
        var par = 0;

        for (var i = 0; i < holes.length; i++) {
            var hole = holes[i];

            if (hole.yardage) {
                var int = parseInt(hole.yardage);

                if (!isNaN(int)) {
                    yardage += int;
                }
            }

            if (hole.par) {
                var int = parseInt(hole.par);

                if (!isNaN(int)) {
                    par += int;
                }
            }
        }

        if (existingCourse) {
            console.log("saving existing course...");

            existingCourse.name = this.name;
            existingCourse.tee = this.tee;
            existingCourse.par = par;
            existingCourse.yardage = yardage;
            existingCourse.slope = this.slope;
            existingCourse.rating = this.rating;
            existingCourse.location.lat = parseFloat(this.location.lat);
            existingCourse.location.lng = parseFloat(this.location.lng);
            existingCourse.holes = holes;

            console.log( "location " + JSON.stringify(existingCourse.location));

            cloudDataCourse.save(existingCourse)
                .then(function (obj) {
                        console.log("saved course " + obj.name);

                        // return to main page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error adding course " + err);
                    });
        } else {
            var course = {
                name: this.name,
                tee: this.tee,
                par: par,
                yardage: yardage,
                slope: this.slope,
                rating: this.rating,
                location: {lat: parseFloat(this.location.lat), lng: parseFloat(this.location.lng)},
                holes: this.holes
            };

            console.log("save course " + course.name + " here");

            cloudDataCourse.add(course)
                .then(function (obj) {
                        console.log("saved course " + obj.name);

                        // switch to picks page
                        window.location.href = returnUrl;
                    },
                    function (err) {
                        console.log("error adding course " + err);
                    });
        }

    };

    $scope.delete = function () {

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'deleteCourse.html',
            controller: 'ModalCourseDeleteCtrl',
            resolve: {
                course: function () {
                    return existingCourse;
                }
            }
        });

        modalInstance.result.then(function (course) {
            console.log("Deleting course " + course.name);
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
    .controller('ModalCourseDeleteCtrl', ['$scope', '$uibModalInstance', 'course', ModalCourseDeleteCtrl]);

function ModalCourseDeleteCtrl($scope, $uibModalInstance, course) {
    $scope.course = course;

    $scope.ok = function () {
        $uibModalInstance.close(course);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}
