/**
 * 
 * Backend API for the home automation app
 *
 */

const ReactServer = require('./reactserver/reactserver.js');
const DbModel = require('./db/dynamomodel');

const Gamer = require('../models/gamer'); 
const Game = require('../models/game'); 
const Event = require('../models/event'); 
const Course = require('../models/course'); 
const Log = require('../models/log'); 

const app = require('./app');

const ApiServer = function (reactClientDir) {
    // core react server handling functions
    const server = new ReactServer(reactClientDir);

    var dbName = 'golfpicks-pwcc';
    var dbNameCourse = 'golfpicks-internal-courses';

    const AWS_CONFIG = {
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY
    }

    const db = new DbModel(AWS_CONFIG, dbName);
    const dbCourse = new DbModel(AWS_CONFIG, dbNameCourse);
    const BASE_URL = '/api';

    this.start = function (port) {

        // create our models
        app.addModel( server, db, BASE_URL, Gamer, 'Gamer', 'Gamers');
        app.addModel( server, db, BASE_URL, Game, 'Game', 'Games');
        app.addModel( server, db, BASE_URL, Event, 'Event', 'Events');
        app.addModel( server, db, BASE_URL, Log, 'Log', 'Logs');
        app.addModel( server, dbCourse, BASE_URL, Course, 'Course', 'Courses');

        console.log('loaded models: ', app.getModels());
        // start the server on the specified port
        server.listen(port);
    }
}

module.exports = ApiServer;