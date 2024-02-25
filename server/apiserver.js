/**
 *
 * Backend API for this app
 *
 */

const DynamoDb = require('@apiserver/db-dynamo');
const DbModel = require('@apiserver/model-db');
const app = require('@apiserver/modelserver');

const Gamer = require('../models/gamer');
const Game = require('../models/game');
const Event = require('../models/event');
const Course = require('../models/course');
const Log = require('../models/log');

/**
 * parse a comma delimited set of CORS sites
 *
 * @param {String} str environment variable.
 * @returns
 */
const parseSites = function (str) {
  if (str) {
    sites = str.split(',');
    return sites;
  }

  return undefined;
};

const ApiServer = function (clientDir) {
  var dbNameGame = 'golfpicks-pwcc';
  var dbNameCourse = 'golfpicks-internal-courses';

  const AWS_CONFIG = {
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY,
  };

  const dbGame = new DynamoDb(AWS_CONFIG, dbNameGame);
  const dbCourse = new DynamoDb(AWS_CONFIG, dbNameCourse);

  const BASE_URL = '/api';
  const protocols = process.env.SWAGGER_PROTOCOL ? [process.env.SWAGGER_PROTOCOL] : undefined;
  const corsSites = parseSites(process.env.CORS_CLIENT);

  this.start = function (port) {
    console.log('corsSites: ', corsSites);

    app.path(BASE_URL, clientDir, corsSites);

    app.explorer('Golfpicks', '/explorer', protocols);

    app.addModel(new DbModel(dbGame, 'Gamer'), Gamer);
    app.addModel(new DbModel(dbGame, 'Game'), Game);
    app.addModel(new DbModel(dbGame, 'Event'), Event);
    app.addModel(new DbModel(dbCourse, 'Course'), Course);
    app.addModel(new DbModel(dbGame, 'Log'), Log);

    const gamer = app.getModel('Gamer');

    /**
     * set a global authorization function for the app
     * we check to make sure a valid gamer has logged in
     *
     * @param {Object} context
     */
    app.auth(async function (context) {
      const session = context.session;

      console.log('auth function called :');
      const result = await gamer.currentUser(session).catch((err) => {
        console.log('auth failed!');
        return null; // null means currentUser failed
      });

      if (result) {
        console.log(`auth function logged in user : ${result.name}, id: ${result.id}`);
      } else {
        console.log('auth function result :', result);
      }
      return result != null;
    });

    console.log('loaded models: ', app.getModels());

    // start the server on the specified port
    app.listen(port);
  };
};

module.exports = ApiServer;
