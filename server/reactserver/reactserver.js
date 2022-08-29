const express = require('express'); // Express web server framework
const cors = require('cors')
const cookieParser = require('cookie-parser');
const session = require("express-session");
const path = require('path');
const bodyParser = require('body-parser');

const ServerError = require('./servererror');
const Redirect = require('./redirect');

var JsonResponse = function (res) {
    this.send = function (obj) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
    };

    this.error = function (code, err) {
        res.setHeader('Content-Type', 'application/json');
        res.status(code);
        res.send(JSON.stringify({ code: code, message: err.message }));
    };
}

/**
 * do a bunch of default initialization for a backend/frontend app
 * such as cors support, static dir and session state
 * 
 * @param {String} clientDirStatic directory for client static files
 * @returns an initialized express app
 */
const initExpress = function (clientDirStatic) {
    const app = express();

    app.use(cors())

    app.use(express.static(clientDirStatic))
        .use(cookieParser())
        .use(bodyParser.json());


    app.use(
        session({
            secret: "MyMiddlewareSecretSessionId",
            resave: true,
            saveUninitialized: true
        })
    );

    return app;
}

const ReactServer = function (clientDirStatic) {
    const app = initExpress(clientDirStatic);

    /**
     * start the server on the specified port
     * 
     * @param {Number} port 
     */
    this.listen = function (port) {
        // catch all other non-API calls and redirect back to our REACT app
        app.get('/*', function (req, res) {
            console.log('no handler for request ', req.path);

            const defaultFile = path.join(clientDirStatic, 'index.html');
            res.sendFile(defaultFile);
        });

        app.listen(port);
    }


    /**
     * We don't do anything here at the moment, but we might want to initialize
     * user data later.
     * 
     * @param {Object} session 
     */
    this.login = function (session) {
        return true;
    }

    /**
     * Kills any current session data, effectively resetting user state
     * 
     * @param {Object} session 
     * @returns true if the session was destroyed
     */
    this.logout = function (session) {

        return new Promise(function (resolve, reject) {
            if (session) {
                session.destroy(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            }
        });

    }

    const processError = function (method, jsonResponse, e) {
        // errors are processed as 500 errors with a message
        if (e instanceof ServerError) {
            console.log(`DEBUG: ${method} caught error ${e.code}: ${e.message}`);
            jsonResponse.error(e.code, e.message);
        }
        else if (e instanceof Error) {
            console.log(`DEBUG: ${method} caught error: ${e.message}`);
            jsonResponse.error(500, e.message);
        } else {
            // if it's not an error object, just return the raw error
            console.log(`DEBUG: ${method} caught error:`, e);
            jsonResponse.error(500, e);
        }
    }

    /**
     * call the registered function and process the result
     */
    const callFn = async function (fn, jsonResponse, req, res) {
        const result = await fn({ session: req.session, query: req.query, params: req.params, body: req.body });

        // if result is an instance of a special object (like a redirect)
        // we handle that here.  Otherwise we assume it's a JSON response and
        // send that back

        if (result instanceof Redirect) {
            console.log('DEBUG: found redirect!');

            const url = result.getUrl();
            res.redirect(url);
        } else {
            jsonResponse.send(result);
        }
    }

    /**
     * Do all the pre and post processing from the raw express function to our 
     * higher level functions.  The idea is to allow the functions to focus on 
     * taking an action and returning a JSON result.  
     * The supplied fn will be get access to session
     * and query data.  By default, the function will return a  
     * Javascript object that will be turned into JSON to send back.  Some
     * special objects can be returned instead of JSON to handle other cases
     * where a result isn't being returned.  A redirect is the most common example.
     * In those cases, the fn just returns a redirect object, which will then be
     * processed by this function.
     * 
     * @param {String} path 
     * @param {Function} fn user supplied function that will received a context object
     */
    const getMethod = function (path, fn) {

        const handler = function (req, res) {
            const jsonResponse = new JsonResponse(res);

            // call the function supplied and process the result
            console.log(`DEBUG: GET handler for ${path} called.`);

            callFn(fn, jsonResponse, req, res)
                .catch((e) => {
                    processError('getMethod', jsonResponse, e);
                });
        }

        // register this path with our handler function to wrap the user function
        app.get(path, handler);
    }

    const deleteMethod = function (path, fn) {

        const handler = function (req, res) {
            const jsonResponse = new JsonResponse(res);

            // call the function supplied and process the result
            console.log(`DEBUG: DELETE handler for ${path} called.`);

            callFn(fn, jsonResponse, req, res)
                .catch((e) => {
                    processError('deleteMethod', jsonResponse, e);
                })
        }

        // register this path with our handler function to wrap the user function
        app.delete(path, handler);
    }

    /**
     * Do all the pre and post processing from the raw express function to our 
     * higher level functions.  The idea is to allow the functions to focus on 
     * taking an action and returning a JSON result.  
     * The supplied fn will be get access to session
     * and query data.  By default, the function will return a  
     * Javascript object that will be turned into JSON to send back.  Some
     * special objects can be returned instead of JSON to handle other cases
     * where a result isn't being returned.  A redirect is the most common example.
     * In those cases, the fn just returns a redirect object, which will then be
     * processed by this function.
     * 
     * @param {String} path 
     * @param {Function} fn user supplied function that will received a context object
     */
    const postMethod = function (path, fn) {

        const handler = function (req, res) {
            const jsonResponse = new JsonResponse(res);

            // call the function supplied and process the result
            console.log(`DEBUG: POST handler for ${path} called.`);

            callFn(fn, jsonResponse, req, res)
                .catch((e) => {
                    processError('postMethod', jsonResponse, e);
                })
        }

        // register this path with our handler function to wrap the user function
        app.post(path, handler);
    }

    const putMethod = function (path, fn) {

        const handler = function (req, res) {
            const jsonResponse = new JsonResponse(res);

            // call the function supplied and process the result
            console.log(`DEBUG: PUT handler for ${path} called.`);

            callFn(fn, jsonResponse, req, res)
                .catch((e) => {
                    processError('putMethod', jsonResponse, e);
                })
        }

        // register this path with our handler function to wrap the user function
        app.put(path, handler);
    }

    /**
     * main function for defining REST methods for this server
     * 
     * @param {String} path path for this method
     * @param {String} verb GET, POST (for now)
     * @param {Function} fn function called when this method is invoked
     */
    this.method = function (path, verb, fn) {
        switch (verb.toUpperCase()) {
            case 'GET':
                return getMethod(path, fn);

            case 'POST':
                return postMethod(path, fn);

            case 'PUT':
                return putMethod(path, fn);

            case 'DELETE':
                return deleteMethod(path, fn);

            default:
                throw new Error(`invalid verb ${verb} supplied to method`)
        }
    }
}

module.exports = ReactServer;