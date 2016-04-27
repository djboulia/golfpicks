/**
 *
 * Cloud Objects SDK
 *
 * Implements Javascript-friendly data structures to talk to back end cloud data
 *
 * Change History
 * [12/19/2013] djb 0.0.1 Initial browser support
 * [12/23/2013] djb 0.0.2 Node.js support
 * [01/08/2014] djb 0.0.3 Code cleanup
 * [02/11/2014] djb 0.0.4 Migrate to beta 2 REST API
 * [07/28/2015] djb 0.1.0 Migrate to Cloudant back-end, rename to cloud-objects
 *
 **/

(function (root) {

    // define some helpful utility functions
    var toString = {}.toString,
        testPrefix = "[object ",
        arrayMarker = testPrefix + "Array]",
        stringMarker = testPrefix + "String]",
        functionMarker = testPrefix + "Function]",

        isArray = function (it) {
            return toString.call(it) == arrayMarker;
        },

        isString = function (it) {
            return toString.call(it) == stringMarker;
        },

        isFunction = function (it) {
            return toString.call(it) == functionMarker;
        },

        mix = function (source, target) {
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        },

        has = function (obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key);
        };

    var dataUrl = {
        queryClasses: function (baseUrl, appId) {
            return baseUrl + '/data/classnames';
        },

        queryObject: function (baseUrl, appId, objectId) {
            return baseUrl + '/data/objects/' + objectId;
        },

        queryObjects: function (baseUrl, appId, className) {
            return baseUrl + '/data/objects?classname=' + className;
        },

        deleteObject: function (baseUrl, appId, objectId) {
            return baseUrl + '/data/objects/' + objectId;
        },

        updateObject: function (baseUrl, appId, objectId) {
            return baseUrl + '/data/objects/' + objectId;
        },

        createObject: function (baseUrl, appId) {
            return baseUrl + '/data/objects';
        }
    };


    //
    // support browser and Node environments with one library.
    // we use the utils object to hold common functions that
    // need different implementations across the browser and 
    // server environments
    // 
    var isNode = false;

    // HACK: fake up a module system that works for Node and in the browser
    var utils = {
        _modules: {},
        require: function (deps, fn) {
            var obj;
            if (deps.length > 1) {
                utils.error("Dependency list not supported");
            }

            for (var i = 0; i < deps.length; i++) {
                if (!utils._modules[deps[i]]) {
                    utils.error("Unkown module " + deps[i]);
                }
                obj = utils._modules[deps[i]];
            }

            // call the supplied function after modules are loaded
            fn(obj);
        },

        // add each module block to our global module list
        define: function (name, block) {
            if (isFunction(block)) {
                utils._modules[name] = block();
            } else {
                utils._modules[name] = block;
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        isNode = true;

        utils.export = function (obj) {
            module.exports = obj;
        };

        utils.log = console.log;
        utils.error = console.error;

        // create a Node version for handling http requests 
        utils.xhr = function (method, url, options) {
            var urlObject = require('url');
            var parts = urlObject.parse(url);

            var http = require('http');
            if (parts.protocol == "https:") {
                utils.log("setting https");
                http = require('https');
            }

            callback = function (response) {
                var str = '';

                //another chunk of data has been recieved, so append it to `str`
                response.on('data', function (chunk) {
                    //                    utils.log("got data chunk " + chunk);
                    str += chunk;
                });

                //the whole response has been recieved, so we just print it out here
                response.on('end', function () {
                    //                    utils.log("found result " + str);
                    if (response.statusCode == 200) {
                        options.success(str);
                    } else {
                        options.error(response);
                    }
                });

                response.on('error', function (e) {
                    utils.log("found error " + e);
                    options.error(e);
                });
            }

            var httpopts = {
                host: parts.hostname,
                port: parts.port,
                path: parts.path,
                method: method
            };

            if (options.headers) {
                httpopts.headers = {};
                mix(headers, httpopts.headers);
            }

            // if the applicationId is specified, add it as a header
            if (options.applicationId) {
                httpopts.headers = httpopts.headers || {};
                httpopts.headers['X-APPID'] = options.applicationId;
            }

            if (method == 'POST' || method == 'PUT') {
                utils.log("Calling " + method +
                    " for protocol " + parts.protocol +
                    " with " + JSON.stringify(httpopts));

                utils.log("Sending data " + options.data);

                var postRequest = http.request(httpopts,
                    callback);
                postRequest.write(options.data);
                postRequest.end();

            } else if (method == 'GET' || method == 'DELETE') { // assume GET
                utils.log("Calling " + method +
                    " for protocol " + parts.protocol +
                    " with " + JSON.stringify(httpopts));

                http.request(httpopts, callback).end();
            } else {
                utils.error("Unsupported method " + method);
            }
        }

    } else {
        // browser environment
        utils.export = function (obj) {
            root.CloudObjects = obj;
        };

        utils.log = function (str) {
            console.log(str);
        };
        utils.error = function (str) {
            console.error(str);
        };

        // create a browser version for handling http requests 
        utils.xhr = function (method, url, options) {
            var _xhr = new XMLHttpRequest();
            _xhr.onreadystatechange = function () {
                if (_xhr.readyState == 4) {
                    if (_xhr.status == 200) {
                        if (options.success) options.success(_xhr.responseText);
                    } else {
                        if (options.error) options.error({
                            code: _xhr.status,
                            message: _xhr.response
                        });
                    }
                } else {
                    //                  utils.log("ajax call, transitioning to readystate " + _xhr.readyState);
                }
            }

            _xhr.open(method, url, true);
            _xhr.setRequestHeader("X-APPID", options.applicationId);
            if (method == "POST" || method == "PUT" && options.data) {
                var data = JSON.stringify(options.data);
                _xhr.setRequestHeader("Content-Type", "application/json");
                utils.log("url : " + url + " params = " + data);
                _xhr.send(data);
            } else {
                _xhr.send();
            }
        }
    }

    utils.define("com/ibm/BaaS/Object", {

        applicationId: "",
        baseUrl: "",
        _baasObjects: {},

        initialize: function (pluginManager, pluginId, parameters) {
            utils.log("Initializing com/ibm/BaaS/Object");

            var baas = pluginManager.baas;

            this.applicationId = baas.applicationId;
            this.baseUrl = baas.defaultEndpoint;
        },

        // internal getters and setters used by the framework

        _addRaw: function (rawObj) {
            // add an object from the cloud to our known list of objects
            // if the object is already in our list, this version will 
            // replace it, effectively updating our internal state
            // return a pointer to the object back to the caller

            if (!rawObj || !isString(rawObj._id)) {
                utils.error("Invalid object id" + JSON.stringify(rawObj._id));

                return undefined;
            }

            this._baasObjects[rawObj._id] = rawObj;

            var ptr = this.create(rawObj.className);

            ptr._type = "Pointer";
            ptr._id = rawObj._id;
            ptr.attributes = undefined;

            //utils.log("creating pointer " + JSON.stringify(this));

            return ptr;
        },

        _getRawObject: function (objectId) {
            if (!isString(objectId)) {
                utils.error("_getRawObject: Invalid object id" + JSON.stringify(objectId));

                return undefined;
            } else {
                return this._baasObjects[objectId];
            }
        },

        _removeRawObject: function (rawObj) {
            var objectId = rawObj._id;

            this._baasObjects[objectId] = undefined;

            rawObj.type = "Deleted";
            rawObj._id = undefined;
            rawObj.attributes = undefined;
        },

        _makeLocalObject: function (obj) {
            // turn a local reference (not saved to backend yet) into object form
            return {
                "className": obj.className,
                "attributes": obj.attributes
            };
        },

        deserialize: function (str) {
            var rawObj = JSON.parse(str);

            utils.log("deserialize: adding raw object " + JSON.stringify(rawObj));

            return this._addRaw(rawObj);
        },

        create: function (className, obj) {
            var ObjectModule = this;

            //
            // BaaSObject
            // declare our internal object representing data returned from the baas
            //
            // _type : Reference or Pointer
            //          a Reference represents an object created locally in the SDK
            //          that hasn't been saved to the backend yet.
            //          after an initial "save()" or "get" of an object from the backend,
            //          the type will switch to Pointer.  The property access is the same
            //          for both types, e.g. "set" and "get" are available and the SDK
            //          handles the differences internally between References and Pointers
            //
            // objectId : for Pointer types, the unique id of the object represented on the
            //          backend.  For Reference types the objectId is undefined until the 
            //          first save() to the backend.
            //
            // attributes: for Reference types, this holds the data/properties of the object.
            //          for Pointer types this field is undefined.
            //
            var BaaSObject = function (className, obj) {
                // make an object that hasn't yet been assigned to the back end
                this._type = "Reference";
                this.className = className;
                this._id = undefined; // not yet saved to backend.. no objectId
                this.attributes = {};

                if (obj != undefined) {
                    if (obj instanceof BaaSObject) {
                        // special case... creating a BaaSObject from an existing
                        // BaaSObject
                        if (obj.isPointer()) {
                            // get the real object
                            var rawObj = ObjectModule._getRawObject(obj.getObjectId());
                            mix(rawObj.attributes, this.attributes);
                        } else {
                            mix(obj.attributes, this.attributes);
                        }
                    } else {
                        mix(obj, this.attributes);
                    }
                }

            };

            BaaSObject.prototype.serialize = function () {
                var rawObj = ObjectModule._getRawObject(this.getObjectId());

                return JSON.stringify(rawObj);
            };

            // the data inside the BaaSObject is opaque for pointer references
            // so provide a stringify function that prints out useful information
            BaaSObject.prototype.stringify = function () {
                if (this._type == "Reference") {
                    var val = this._makeLocalObject();

                    return JSON.stringify(val);
                } else {
                    return JSON.stringify(ObjectModule._getRawObject(this.getObjectId()));
                }
            }

            BaaSObject.prototype.getObjectId = function () {
                return this._id;
            };

            BaaSObject.prototype.getClassName = function () {
                return this.className;
            };

            BaaSObject.prototype.isPointer = function () {
                return this._type == "Pointer";
            }

            BaaSObject.prototype.set = function (key, val) {
                if (this._type == "Reference") {
                    this.attributes[key] = val;
                } else {
                    ObjectModule._getRawObject(this.getObjectId()).attributes[key] = val;
                }
            };

            BaaSObject.prototype.get = function (key) {
                if (this._type == "Reference") {
                    return this.attributes[key];
                } else {
                    return ObjectModule._getRawObject(this.getObjectId()).attributes[key];
                }
            };

            BaaSObject.prototype.delete = function (handler) {

                var objectId = this.getObjectId();

                utils.log("issuing DELETE for: " +
                    dataUrl.deleteObject(
                        ObjectModule.baseUrl,
                        ObjectModule.applicationId,
                        this.getObjectId()));

                utils.xhr("DELETE",
                    dataUrl.deleteObject(ObjectModule.baseUrl,
                        ObjectModule.applicationId,
                        this.getObjectId()), {
                        applicationId: ObjectModule.applicationId,
                        success: function (responseText) {
                            var result = JSON.parse(responseText)

                            if (result.status == "success") {
                                utils.log("delete successful");

                                // remove it from our internal lists
                                ObjectModule._removeRawObject(this);

                                if (handler && isFunction(handler.success)) {
                                    handler.success(objectId);
                                }
                            } else {
                                if (handler != undefined && handler.error != undefined) {
                                    handler.error(responseText);
                                }
                            }
                        },
                        error: function (err) {
                            utils.error(err);

                            if (handler && has(handler.error))
                                handler.error(err);
                        }
                    });
            };

            BaaSObject.prototype.save = function (handler) {

                if (this.isPointer()) {
                    var payload = ObjectModule._getRawObject(this.getObjectId());

                    utils.log("issuing PUT for: " +
                        dataUrl.updateObject(
                            ObjectModule.baseUrl,
                            ObjectModule.applicationId,
                            this.getObjectId()));

                    utils.xhr("PUT",
                        dataUrl.updateObject(ObjectModule.baseUrl,
                            ObjectModule.applicationId, this.getObjectId()), {
                            applicationId: ObjectModule.applicationId,
                            data: payload,
                            success: function (responseText) {
                                var result = JSON.parse(responseText);

                                if (result.status == "success") {
                                    var rawObj = result.object;

                                    if (handler && isFunction(handler.success)) {
                                        handler.success(ObjectModule._addRaw(rawObj));
                                    }
                                } else {
                                    if (handler && isFunction(handler.error)) {
                                        handler.error(responseText);
                                    }
                                }
                            },
                            error: function (err) {
                                utils.error(err);

                                if (handler && isFunction(handler.error)) {
                                    handler.error(err);
                                }
                            }
                        });
                } else {
                    // no existing objectid, just do insert of new object
                    var payload = ObjectModule._makeLocalObject(this);

                    utils.xhr("POST",
                        dataUrl.createObject(ObjectModule.baseUrl,
                            ObjectModule.applicationId), {
                            applicationId: ObjectModule.applicationId,
                            data: payload,
                            success: function (responseText) {
                                var result = JSON.parse(responseText);

                                if (result.status == "success") {
                                    var rawObj = result.object;

                                    if (handler && isFunction(handler.success)) {
                                        handler.success(ObjectModule._addRaw(rawObj));
                                    }
                                } else {
                                    if (handler && isFunction(handler.error)) {
                                        handler.error(responseText);
                                    }
                                }
                            },
                            error: function (err) {
                                utils.error(err);

                                if (handler && isFunction(handler.error))
                                    handler.error(err);
                            }
                        });
                }
            }

            return new BaaSObject(className, obj);
        }

    });

    //
    // User Module
    //
    // there is currently no concept of a "User" in the current beta functionality
    // this module implements a simple User object in the backend data store with
    // functionality to handle login/logout and support the concept of a User session
    //
    // NOTE: we don't currently restrict this module to a Node-only environment, but
    //       not sure it makes sense in anything but a browser context.
    //
    utils.define("com/ibm/BaaS/User", {
        pluginManager: {},
        _currentUser: undefined,

        initialize: function (pluginManager, pluginId, parameters) {
            utils.log("Initializing com/ibm/BaaS/User");

            var baas = pluginManager.baas;

            this._cookieName = baas.applicationId; // user/cookie name unique to each app
            this.pluginManager = pluginManager;
        },

        _getCookie: function (c_name) {
            var c_value = document.cookie;
            var c_start = c_value.indexOf(" " + c_name + "=");

            if (c_start == -1) {
                c_start = c_value.indexOf(c_name + "=");
            }

            if (c_start == -1) {
                c_value = null;
            } else {
                c_start = c_value.indexOf("=", c_start) + 1;
                var c_end = c_value.indexOf(";", c_start);
                if (c_end == -1) {
                    c_end = c_value.length;
                }
                c_value = unescape(c_value.substring(c_start, c_end));
            }

            return c_value;
        },

        _setCookie: function (c_name, value, exdays) {
            var exdate = new Date();

            exdate.setDate(exdate.getDate() + exdays);

            var c_value = escape(value) +
                ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());

            document.cookie = c_name + "=" + c_value;
        },

        current: function () {

            if (!this._currentUser) {
                // look at the cookies to fluff up our user object if it exists
                var cookie = this._getCookie(this._cookieName);

                if (cookie && cookie.length > 0) {
                    var ObjectModule = this.pluginManager.getPluginById("Object");

                    this._currentUser = ObjectModule.deserialize(cookie);
                }
            }

            return this._currentUser;
        },

        logIn: function (user, pass, callback) {
            if (this.current()) {
                this.logOut(); // logout any currently logged in user
            }

            var myThis = this;

            var ObjectModule = this.pluginManager.getPluginById("Object");
            var QueryModule = this.pluginManager.getPluginById("Query");

            var query = QueryModule.create("Gamer");
            query.isEqualTo("username", user);
            query.isEqualTo("password", pass);
            query.find({
                success: function (result) {
                    console.log("login found: " + JSON.stringify(result));
                    if (isArray(result) && result.length == 1) {
                        var obj = result[0];

                        // save our result as a cookie so we stay logged in across pages/reloads
                        myThis._setCookie(myThis._cookieName, obj.serialize(), 7);
                        myThis._currentUser = obj;

                        if (callback && callback.success) {
                            callback.success(user);

                            return;
                        }
                    }

                    if (callback && callback.error) {
                        callback.error(user, "Incorrect username or password");
                    }
                },
                error: function (obj) {
                    if (callback && callback.error) {
                        callback.error(user, obj);
                    }
                }
            });

        },

        logOut: function () {
            if (this.current()) {
                // unset the cookie to show we're logged out
                this._setCookie(this._cookieName, "");
                this._currentUser = undefined;
            } else {
                utils.error("logOut error: Not logged in.");
            }
        }
    });

    //
    // QueryClass - internal class to generate a query to search the backend data store
    //
    var QueryClass = function (query, className) {
        this.filters = [];
        this.query = query;

        if (!isString(className)) {
            if (className && has(className, "className")) {
                this.className = className["className"];
            } else {
                utils.error("Error: QueryClass expects a className string");
            }
        } else {
            this.className = className;
        }

        function specialKey(key) {
            if (key == "_id" || key == "_rev" || key == "className") {
                return true;
            } else {
                return false;
            }
        }

        function getKey(obj, key) {
            if (specialKey(key)) {
                return obj[key];
            } else {
                var val = (obj.attributes) ? obj.attributes[key] : undefined;

                return val;
            }
        }

        // filters... these can be added cumulatively to get increasingly 
        // more specific query functionality, e.g.
        //
        // query.isEqualTo( "key1", "val1" );
        // query.isEqualTo( "key2", "val2" );
        // query.containedIn( "key3", [ "val3", "val4"] );
        //
        // would only match records where key1==val1, key2==val2, and key3 == val3 or val4
        //

        // isEqualTo
        //  key: the key we are looking for
        //  val: the val of this key
        this.isEqualTo = function (key, val) {
            this.filters.push({
                "func": function (obj, parms) {

                    if (obj && (getKey(obj, parms.key) == parms.val)) {
                        return true;
                    } else {
                        return false;
                    }
                },
                "args": {
                    "key": key,
                    "val": val
                }
            });
        }

        // containedIn
        //  key: the key we are looking for
        //  vals: an array of acceptable values for the key
        this.containedIn = function (key, vals) {
            this.filters.push({
                "func": function (obj, parms) {
                    // ensure at least one of the values matches
                    for (var i = 0; i < parms.vals.length; i++) {
                        if (obj && (getKey(obj, parms.key) == parms.vals[i]))
                            return true;
                    }

                    return false;
                },
                "args": {
                    "key": key,
                    "vals": vals
                }
            });
        }

        // WARNING: this is ugly with current beta functionality... there is no 
        // REST API to query with constraints, e.g. query the 
        // object for a match against selected criteria.
        // So for now we just get ALL of the objects and apply filters to them
        this.find = function (options) {
            var qcThis = this;
            var ObjectModule = this.query.pluginManager.getPluginById("Object");

            // look up our constraints/search criteria
            this.query.getObjects(this.className, {
                success: function (result) {
                    if (result != null) {
                        var findResults = [];

                        // should be an array of objects
                        for (var i = 0; i < result.length; i++) {
                            var obj = result[i];

                            var rawObj = ObjectModule._getRawObject(obj.getObjectId());

                            // apply filters; if any fail, we don't add the object to the results
                            for (var j = 0; j < qcThis.filters.length; j++) {
                                var filter = qcThis.filters[j];

                                //                                console.log("filter.args = " + JSON.stringify(filter.args));

                                if (!filter.func(rawObj, filter.args)) {
                                    obj = undefined;
                                    break;
                                }
                            }

                            if (obj) {
                                // add to our result set
                                findResults.push(obj);
                            }
                        }

                        if (options && has(options, "success")) {

                            options.success(findResults);

                            return;
                        }

                    }

                    if (options && has(options, "error")) {
                        options.error("Bad result returned.");
                    }
                },
                error: function (obj) {
                    if (options && has(options, "error")) {
                        options.error(obj);
                    }
                }
            });
        };

        this.get = function (objectId, options) {

            // look up our constraints/search criteria
            this.query.getObject(this.className, objectId, {
                success: function (result) {
                    if (result != null) {

                        if (options && has(options, "success")) {
                            options.success(result);
                        }

                    } else {
                        if (options && has(options, "error")) {
                            options.error("Bad result returned.");
                        }
                    }
                },
                error: function (obj) {
                    if (options && has(options, "error")) {
                        options.error(obj);
                    }
                }
            });
        };
    };


    utils.define("com/ibm/BaaS/Query", {

        pluginManager: {},
        baas: {},
        applicationId: "",
        baseUrl: "",

        _updateObject: function (rawObj) {
            // update the back end data, return a pointer to it
            var ObjectModule = this.pluginManager.getPluginById("Object");

            return ObjectModule._addRaw(rawObj);
        },

        initialize: function (pluginManager, pluginId, parameters) {
            this.pluginManager = pluginManager;
            this.baas = pluginManager.baas;
            this.applicationId = this.baas.applicationId;
            this.baseUrl = this.baas.defaultEndpoint;

            utils.log("Initializing com/ibm/BaaS/Query with key " +
                this.applicationId + " and url " + this.baseUrl);
        },

        create: function (className) {
            return new QueryClass(this, className);
        },

        getClasses: function (handler) {
            var callback = function (responseText) {
                var result = JSON.parse(responseText);

                if (result.status == "success") {
                    var classNames = result.classNames;

                    if (handler != undefined && handler.success != undefined) {
                        handler.success(classNames);
                    }
                } else {
                    if (handler != undefined && handler.error != undefined) {
                        hander.error(responseText);
                    }
                }
            };

            utils.xhr("GET", dataUrl.queryClasses(this.baseUrl, this.applicationId), {
                applicationId: this.applicationId,
                success: callback,
                error: handler.error
            });
        },

        getObjects: function (className, handler) {
            var myThis = this;
            var callback = function (responseText) {
                var result = JSON.parse(responseText)
                if (result.status == "success") {
                    var objs = result.objects;

                    if (handler != undefined && handler.success != undefined) {
                        var retObjs = [];
                        for (var i = 0; i < objs.length; i++) {
                            retObjs.push(myThis._updateObject(objs[i]));
                        }
                        handler.success(retObjs);
                    }
                } else {
                    if (handler != undefined && handler.error != undefined) {
                        handler.error(responseText);
                    }
                }
            };

            utils.xhr("GET", dataUrl.queryObjects(this.baseUrl, this.applicationId, className), {
                applicationId: this.applicationId,
                success: callback,
                error: handler.error
            });
        },

        getObject: function (className, id, handler) {
            var myThis = this;
            var callback = function (responseText) {
                var result = JSON.parse(responseText);

                if (result.status == "success") {
                    var obj = result.object;

                    if (handler != undefined && handler.success != undefined) {
                        handler.success(myThis._updateObject(obj));
                    }
                } else {
                    if (handler != undefined && handler.error != undefined) {
                        handler.error(responseText);
                    }
                }
            };

            utils.xhr("GET", dataUrl.queryObject(this.baseUrl, this.applicationId, id), {
                applicationId: this.applicationId,
                success: callback,
                error: handler.error
            });
        }
    });


    utils.define("com/ibm/BaaS/Log", {

        pluginManager: {},
        baas: {},
        applicationId: "",
        baseUrl: "",

        initialize: function (pluginManager, pluginId, parameters) {
            this.pluginManager = pluginManager;
            this.baas = pluginManager.baas;
            this.applicationId = this.baas.applicationId;
            this.baseUrl = this.baas.defaultEndpoint;

            utils.log("Initializing com/ibm/BaaS/Log with key " +
                this.applicationId + " and url " + this.baseUrl);
        },

        write: function (user, type, message, handler) {
            var payload = {
                "className": "Log",
                "attributes": {
                    user: user,
                    type: type,
                    message: message,
                    time: Date.now()
                }
            };

            utils.xhr("POST",
                dataUrl.createObject(this.baseUrl,
                    this.applicationId), {
                    applicationId: this.applicationId,
                    data: payload,
                    success: function (responseText) {
                        var result = JSON.parse(responseText);

                        if (result.status == "success") {
                            var rawObj = result.object;

                            if (handler && isFunction(handler.success)) {
                                handler.success(rawObj);
                            }
                        } else {
                            if (handler && isFunction(handler.error)) {
                                handler.error(responseText);
                            }
                        }
                    },
                    error: function (err) {
                        utils.error(err);

                        if (handler && isFunction(handler.error))
                            handler.error(err);
                    }
                });
        }

    });


    utils.define("com/ibm/BaaS/PluginManager", function () {
        // private variables/methods
        var plugins = {};

        function loadPlugin(mgr, plugin) {
            var id = plugin.id;
            var parameters = plugin.parameters;

            plugins[id] = plugin.obj;
            plugins[id].initialize(mgr, id, parameters);
        }

        return {
            baas: {},

            // initialize the list of plugins
            loadPlugins: function (theBaaS, plugins) {
                this.baas = theBaaS;

                var pid;

                for (pid in plugins) {
                    var plugin = plugins[pid];

                    loadPlugin(this, plugin);

                    // add this plugin id to our BaaS namespace
                    utils.log("Loading plugin " + plugin.id);
                    theBaaS[plugin.id] = plugin.obj;
                }

            },

            getPluginById: function (id) {
                return plugins[id];
            }
        }

    });


    utils.define("com/ibm/BaaS", {

        VERSION: "0.1.0",

        _pluginIds: ['User', 'Object', 'Query', 'Log'],
        _isValidPluginId: function (id) {
            var i;

            for (i = 0; i < this._pluginIds.length; i++) {
                if (this._pluginIds[i] == id) {
                    return true;
                }
            }

            return false;
        },

        _initPluginManager: function (plugins) {
            var myThis = this;

            utils.require(['com/ibm/BaaS/PluginManager'], function (mgr) {
                myThis.pluginManager = mgr;

                myThis.pluginManager.loadPlugins(myThis, plugins);
            });
        },

        pluginManager: null,

        init: function (config) {
            // config is an object that needs to have a minimum of two properties:
            //
            // applicationId - a string identifying the application
            // defaultEndpoint - a string URL identifying the back end server
            if (!config || typeof config !== "object") {
                throw "init needs a config object.";
            }

            if (!config.applicationId) {
                throw "init needs a valid applicationId defined in the config";
            }

            this.applicationId = config.applicationId;
            this.defaultEndpoint = (config.defaultEndpoint) ? config.defaultEndpoint : "";

            var pluginMap = {};

            // check for custom plugins
            if (config.plugins) {
                if (!isArray(config.plugins)) {
                    throw "init plugins must be an array";
                }

                var i;

                for (i = 0; i < config.plugins.length; i++) {
                    var plugin = config.plugins[i];

                    // TODO: does this have to be one of our known plugin ids??
                    if (!this._isValidPluginId(plugin.id)) {
                        throw "invalid plugin id " + plugin.id;
                    }

                    pluginMap[plugin.id] = {
                        id: plugin.id,
                        obj: plugin.obj,
                        parameters: plugin.parameters
                    };
                }
            }

            // load up our default modules
            // we allow for the possibility that the default plugin has been replaced by
            // another implementation.  If the user passed another implementation via
            // the init call, we use that instead of loading the internal implementation.
            //
            // TODO: revisit if the ability to override default modules is intended behavior 
            //        
            utils.require(['com/ibm/BaaS/Query'], function (code) {
                // has it been overriden? 
                if (!pluginMap["Query"]) {
                    pluginMap["Query"] = {
                        id: "Query",
                        obj: code
                    };
                }
            });

            utils.require(['com/ibm/BaaS/Object'], function (code) {
                // has it been overriden? 
                if (!pluginMap["Object"]) {
                    pluginMap["Object"] = {
                        id: "Object",
                        obj: code
                    };
                }
            });

            utils.require(['com/ibm/BaaS/User'], function (code) {
                // has it been overriden? 
                if (!pluginMap["User"]) {
                    pluginMap["User"] = {
                        id: "User",
                        obj: code
                    };
                }
            });

            utils.require(['com/ibm/BaaS/Log'], function (code) {
                // has it been overriden? 
                if (!pluginMap["Log"]) {
                    pluginMap["Log"] = {
                        id: "Log",
                        obj: code
                    };
                }
            });

            this._initPluginManager(pluginMap);

        }
    });

    utils.require(['com/ibm/BaaS'], function (baas) {
        // we know the baas module has been defined already so we count on this
        // callback being invoked immediately rather than deferred.  Is there a better way?
        utils.export(baas);
    });

}(this));
