/**
 * 
 * Backend API for the home automation app
 *
 */

const ReactServer = require('./reactserver/reactserver.js');
const DbModel = require('./db/dynamomodel');
const ModelServer = require("./modelimpl/modelserver");

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
        const modelServer = new ModelServer(server, BASE_URL);
        modelServer.enableExplorer('');
            
        // create our models
        app.addModel( modelServer, db, Gamer, 'Gamer', 'Gamers');
        app.addModel( modelServer, db, Game, 'Game', 'Games');
        app.addModel( modelServer, db, Event, 'Event', 'Events');
        app.addModel( modelServer, dbCourse, Course, 'Course', 'Courses');
        app.addModel( modelServer, db, Log, 'Log', 'Logs');

        console.log('loaded models: ', app.getModels());
        // start the server on the specified port
        server.listen(port);
    }
}

module.exports = ApiServer;