/**
 * Connect to our data source, extend the model if necessary
 * and expose API end points for this model.
 * 
 */

const scores = require('../common/lib/scores.js');
const app = require('../server/app')

const Event = function (modelServer, model) {

    model.scores = async function (id) {
        console.log("getting scores for event " + id);

        const Course = app.getModel('Course');

        const eventrecord = await model.findById(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            })

        console.log("called showScore for id " + id);

        var event = eventrecord.attributes;
        var courseid;

        if (event.rounds && event.rounds.length > 0) {
            // use the first day's course as the course for all rounds
            courseid = event.rounds[0].course;
        } else {
            var str = "Invalid event object. No round info found!";

            console.error(str);
            throw new Error(str);
        }

        console.log("finding course " + courseid);

        // find the course information
        const courserecord = await Course.findById(courseid)
            .catch((err) => {
                console.error("Error!" + JSON.stringify(err) + " courserecord " + courserecord);
                throw new Error(err);
            })

        // call the scoring service
        const result = await scores.get(event)
            .catch((e) => {
                console.error("Error!" + JSON.stringify(err));
                throw new Error(err);
            })

        return result;
    }

    model.weather = async function (id) {
        console.log("getting weather for event " + id);

        const Course = app.getModel('Course');

        const eventrecord = await model.findById(id)
            .catch((e) => {
                var str = "Could not find event id " + id;
                console.error(str);
                throw new Error(str);
            });

        console.log("found id " + id);

        const event = eventrecord.attributes;
        var courseid;

        if (event.rounds && event.rounds.length > 0) {
            // use the first day's course as the course for all rounds
            courseid = event.rounds[0].course;
        } else {
            const str = "Invalid event object. No round info found!";

            console.error(str);
            throw new Error(str);
        }

        console.log("finding course " + courseid);

        // find the course information
        const result = await Course.weather(courseid)
            .catch((e) => {
                const str = "No location info for course " + courseid;
                console.error(str);
                throw new Error(str);
            })

        return result;
    }

    // expose the create, read, update methods from this model
    modelServer.addCrudMethods(model);

    // add any additional entry points here
    modelServer.method(
        '/:id/scores',
        'GET',
        [
            {
                name: 'id',
                source: 'param',
                type: 'string'
            },
        ],
        model.scores
    );

    modelServer.method(
        '/:id/weather',
        'GET',
        [
            {
                name: 'id',
                source: 'param',
                type: 'string'
            },
        ],
        model.weather
    );

}

module.exports = Event;