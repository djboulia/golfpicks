angular.module('GolfPicks.mapWidget', [])
    .factory('mapWidget', [function () {

        var courseUrl = "#/coursedetails";
        var openWindow = undefined;

        return {
            create: function (htmlElement, location) {

                var map = new google.maps.Map(document.getElementById(htmlElement), {
                    zoom: 5
                });

                var gLocation = new google.maps.LatLng(location.lat, location.lng);
                map.setCenter(gLocation);

                return map;
            },

            addCourseMarker: function (label, course, map) {
                var location = course.location;

                // Add the marker at the clicked location, and add the next-available label
                // from the array of alphabetical characters.
                var marker = new google.maps.Marker({
                    position: location,
                    label: label,
                    title: course.name,
                    map: map
                });

                marker.addListener('click', function () {
                    var contentString = '<div><div>Round:<b>' + label + '</b></div>' +
                        '<div>Course:<b> <a href="' + courseUrl + '/id/' + course._id + '">' + course.name + '</a></b></div>' +
                        '<div>Par:<b>' + course.par + '</b></div>' +
                        '</div>';

                    var infoWindow = new google.maps.InfoWindow({
                        content: contentString
                    });

                    if (openWindow) {
                        openWindow.close();
                        openWindow = undefined;
                    }

                    infoWindow.open(map, marker);

                    openWindow = infoWindow;

                    console.log('clicked! ' + label);
                });

            }
        }

}]);
