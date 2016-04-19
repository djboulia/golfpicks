angular.module('GolfPicks')
    .controller('CourseDetailsCtrl', ['$scope', '$stateParams', '$cookieStore',
                                      'cloudDataCourse', 'cloudDataCurrentUser', 'weatherData', CourseDetailsCtrl]);

function CourseDetailsCtrl($scope, $stateParams, $cookieStore, cloudDataCourse, currentUser, weatherData) {
    var returnUrl = "#/courses";

    console.log("reached courses controller with id " + $stateParams.id);

    var existingCourse = undefined;

    if ($stateParams.id) {
        // load up the existing data in our form
        $scope.title = "Course Details";
        $scope.id = $stateParams.id;
        $scope.editable = currentUser.isAdmin();

        cloudDataCourse.get($stateParams.id, {
            success: function (obj) {
                existingCourse = obj;

                $scope.name = existingCourse.name;
                $scope.tee = existingCourse.tee;
                $scope.par = existingCourse.par;
                $scope.yardage = existingCourse.yardage;
                $scope.slope = existingCourse.slope;
                $scope.rating = existingCourse.rating;

                var front9 = {
                    yardage: 0,
                    par: 0,
                    holes: []
                }

                if (existingCourse.holes) {
                    for (var i = 0; i < 9; i++) {
                        var hole = existingCourse.holes[i];

                        front9.yardage += parseInt(hole.yardage);
                        front9.par += parseInt(hole.par);
                        front9.holes.push(hole);
                    }
                }

                $scope.front9 = front9;

                var back9 = {
                    yardage: 0,
                    par: 0,
                    holes: []
                }

                if (existingCourse.holes) {
                    for (var i = 9; i < 18; i++) {
                        var hole = existingCourse.holes[i];

                        back9.yardage += parseInt(hole.yardage);
                        back9.par += parseInt(hole.par);
                        back9.holes.push(hole);
                    }
                }

                $scope.back9 = back9;

                $scope.hasHoleDetails = (existingCourse.holes) ? true : false;

                if (existingCourse.location) {
                    var location = existingCourse.location;

                    weatherData.forecast(
                        location.lat,
                        location.lng, {
                            success: function (data) {
                                console.log("Data from weather service: " + JSON.stringify(data));

                                data.temp = Math.round(data.temp);
                                data.wind = Math.round(data.wind);
                                data.metric.temp = Math.round(data.metric.temp);

                                $scope.weather = data;
                                $scope.weatherImg = '<img src="' + data.icon + '">';
                            },
                            error: function (err) {
                                console.log("Error from weather service: " + err);
                            }
                        });
                }

                $scope.existingCourse = true;
            },
            error: function (err) {
                console.log("error getting course " + err);
            }
        });
    } else {
        $scope.title = "Course Information Not Found";
    }

};
