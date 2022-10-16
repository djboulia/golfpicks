/**
 * 
 * Backend API for this app
 *
 */

const DynamoDb = require('./modelimpl/db/dynamodb');

const Gamer = require('../models/gamer');
const Game = require('../models/game');
const Event = require('../models/event');
const Course = require('../models/course');
const Log = require('../models/log');

const app = require('./modelimpl/app');
const DbModel = require('./modelimpl/dbmodel');

const ApiServer = function (clientDir) {

    var dbNameGame = 'golfpicks-pwcc';
    var dbNameCourse = 'golfpicks-internal-courses';

    const AWS_CONFIG = {
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY
    }

    const dbGame = new DynamoDb(AWS_CONFIG, dbNameGame);
    const dbCourse = new DynamoDb(AWS_CONFIG, dbNameCourse);

    const BASE_URL = '/api';
    const protocols = (process.env.SWAGGER_PROTOCOL) ? [process.env.SWAGGER_PROTOCOL] : undefined;

    this.start = function (port) {

        app.path(BASE_URL, clientDir);

        app.explorer("Golfpicks", '/explorer', protocols);

        app.addModel(new DbModel(dbGame, 'Gamer'), Gamer);
        app.addModel(new DbModel(dbGame, 'Game'), Game);
        app.addModel(new DbModel(dbGame, 'Event'), Event);
        app.addModel(new DbModel(dbCourse, 'Course'), Course);
        app.addModel(new DbModel(dbGame, 'Log'), Log);

        console.log('loaded models: ', app.getModels());

        // start the server on the specified port
        app.listen(port);
    }
}

module.exports = ApiServer;