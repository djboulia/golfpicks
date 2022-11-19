/**
 * Connect to our data source and expose API end points
 * for this model.
 * 
 */

const Weather = require('../common/lib/weather.js');

const Course = function (model) {

    // add a weather method to our model
    model.weather = async function (id) {
        console.log("getting weather for course " + id);

        // find the course information
        const course = await model.findById(id);

        // look for lat/long coordinates for this course
        if (course.location && course.location.lat && course.location.lng) {
            const weather = new Weather();

            const lat = course.location.lat;
            const lng = course.location.lng;

            const result = await weather.forecast(lat, lng)
                .catch((e) => {
                    console.error("Weather call failed for course " + id + ", lat=" + lat + " lng=" + lng);
                    throw e;
                });

            console.log("Found weather info for course " + id + ", lat=" + lat + " lng=" + lng);
            return result;
        } else {
            const str = "No location info for course " + id;
            console.error(str);
            throw new Error(str);
        }
    };

    // expose the create, read, update methods from this model
    model.addCrudMethods();

    // add any additional entry points here
    model.method(
        '/:id/weather',
        'GET',
        {
            description: "Get the current weather conditions for this course",
            responses: [
                {
                    code: 200,
                    description: ""
                }
            ],
            params: [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ]
        },
        model.weather
    );
}

module.exports = Course;