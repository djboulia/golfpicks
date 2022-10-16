const ReactServer = require('../reactserver/reactserver.js');
const ModelExplorer = require('./modelexplorer');

/**
 * Implements specific methods for serving up model instances for the
 * app.  Wraps a ReactServer instance with additional handlers for models.
 * 
 * @param {String} basePath base path for all API calls
 * @param {String} staticDir local path for serving static files
 */
const ModelServer = function (basePath, staticDir) {
    const swagger = {
        explorer: false
    };

    // core react server handling functions
    const reactServer = new ReactServer(staticDir);

    const explorer = new ModelExplorer();

    this.enableExplorer = function(name, path, protocols) {
        swagger.explorer = true;
        swagger.name = name;
        swagger.path = path;
        swagger.protocols = protocols;
    }

    /**
     * Call this to hang an API explorer endpoint at the supplied
     * path.  This will provide a UI for accessing all of the API 
     * endpoints.
     * 
     * @param {String} path 
     */
    const addSwagger = function (name, path, protocols) {
        const doc = explorer.getSwaggerDoc(name);

        const options = {
            protocols: protocols
        }

        reactServer.explorer(path, doc, options);
    }

    /**
     * start the server on the specified port
     * 
     * @param {Integer} port 
     */
    this.listen = function (port) {
        if (swagger.explorer) {
            addSwagger(swagger.name, swagger.path, swagger.protocols);
        }

        reactServer.listen(port);
    }

    /**
     * extend the base model with our additional server methods
     * 
     * @param {Object} model model to extend
     */
    this.extend = function (model) {
        const modelServer = this;
        const modelName = model.getModelName();
        const modelNamePlural = model.getModelNamePlural();

        model.addCrudMethods = function () {
            modelServer.addCrudMethods(modelName, modelNamePlural, model);
        }

        model.method = function (path, verb, metadata, method) {
            modelServer.method(modelName, modelNamePlural, model, path, verb, metadata, method);
        }
    }

    /**
     * internal method handler.  automatically 
     * appends the basePath (e.g. api/Models)
     * to all requests
     * 
     * @param {String} modelApiName -  
     * @param {String} path 
     * @param {String} verb 
     * @param {Function} fn 
     */
    const serverMethod = function (modelApiName, path, verb, fn) {
        const fullPath = `${basePath}/${modelApiName}${path}`;
        return reactServer.method(fullPath, verb, fn);
    }

    /**
     * expose API endpoints for all of the common CRUD methods
     * for this model
     * 
     * @param {Object} model 
     */
    this.addCrudMethods = function (modelName, modelApiName, model) {

        const create = async function (record) {

            if (record) {
                const result = await model.create(record);
                return result;
            } else {
                throw new Error('create: invalid record');
            }
        }

        const put = async function (record) {

            if (record) {
                const result = await model.put(record);
                return result;
            } else {
                throw new Error('put: invalid record');
            }
        }

        const findAll = async function () {
            const result = await model.findAll();
            return result;
        }

        const findById = async function (id) {

            if (id) {
                const result = await model.findById(id);
                return result;
            } else {
                throw new Error('findById: invalid id');
            }
        }

        const findByIds = async function (ids) {

            if (ids) {
                const result = await model.findByIds(ids);
                return result;
            } else {
                throw new Error('findByIds: invalid ids');
            }
        }

        const existsById = async function (id) {

            if (id) {
                const result = await model.findById(id);
                return (result === undefined) ? false : true;
            } else {
                throw new Error('existsById: invalid id');
            }
        }

        const deleteById = async function (id) {

            if (id) {
                const result = await model.deleteById(id);
                return result;
            } else {
                throw new Error('deleteById: invalid id');
            }
        }

        // register this method with our explorer
        this.method(
            modelName,
            modelApiName,
            model,
            '',
            'GET',
            {
                description: "Get all instances of this model",
                responses: [
                    {
                        code: 200,
                        description: "An array containing  model objects"
                    }
                ],
                params: [
                ]
            },
            findAll);

        this.method(
            modelName,
            modelApiName,
            model,
            '',
            'POST',
            {
                description: "Create a new instance of this model",
                responses: [
                    {
                        code: 200,
                        description: "The created model"
                    }
                ],
                params: [
                    {
                        name: 'record',
                        source: 'body',
                        type: 'object'
                    }
                ]
            },
            create);

        this.method(
            modelName,
            modelApiName,
            model,
            '',
            'PUT',
            {
                description: "Update an instance of this model",
                responses: [
                    {
                        code: 200,
                        description: "The updated model"
                    }
                ],
                params: [
                    {
                        name: 'record',
                        source: 'body',
                        type: 'object'
                    },
                ]
            },
            put);

        this.method(
            modelName,
            modelApiName,
            model,
            '/findByIds',
            'POST',
            {
                description: "Find multiple instances of this model",
                responses: [
                    {
                        code: 200,
                        description: "An array containing the found models"
                    }
                ],
                params: [
                    {
                        name: 'ids',
                        source: 'body',
                        type: 'array'
                    },
                ]
            },
            findByIds);

        this.method(
            modelName,
            modelApiName,
            model,
            '/:id',
            'GET',
            {
                description: "Get an instance of this model",
                responses: [
                    {
                        code: 200,
                        description: "The model object"
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
            findById);

        this.method(
            modelName,
            modelApiName,
            model,
            '/:id',
            'DELETE',
            {
                description: "Delete an instance of this model",
                responses: [
                    {
                        code: 200,
                        description: "True if deleted"
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
            deleteById);

        this.method(
            modelName,
            modelApiName,
            model,
            '/:id/exists',
            'GET',
            {
                description: "Determine if an instance of this model exists",
                responses: [
                    {
                        code: 200,
                        description: "true or false"
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
            existsById);
    }

    //
    // example of the format of the metadata object expected 
    // in the method entry point below
    //
    const sampleArgs = {
        description: "Description of this method",
        responses: [
            {
                code: 200,
                description: "good result"
            },
            {
                code: 500,
                description: "bad result"
            }
        ],
        params: [
            {
                name: 'id',
                source: 'param',
                type: 'string'
            },
            {
                name: 'details',
                source: 'query',
                type: 'boolean'
            },
            {
                name: 'picks',
                source: 'body',
                type: 'array'
            }
        ]
    };

    /**
     * 
     * @param {Array} args the list of arg descriptions
     * @param {Object} context holds http context data
     * @returns an array of arguments to be sent to the method handler
     */
    const parseArgs = function (args, context) {
        const result = [];

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (!arg.name) throw new Error('name property is required for each argument');

            switch (arg.source) {
                case 'param':
                    result.push(context.params[arg.name]);
                    break;

                case 'query':
                    result.push(context.query[arg.name]);
                    break;

                case 'body':
                    // return the whole body as a parameter
                    result.push(context.body);
                    break;

                default:
                    throw new Error(`invalid source type ${arg.source}`);
            }
        }

        return result;
    }

    /**
     * convenience method to call a model handler
     * with a set of parameters.  This isolates the handler functions
     * from needing to know about the underlying HTTP details
     * 
     * @param {String} path 
     * @param {String} verb 
     * @param {Object} metadata descriptions about the method, its arguments, etc. (see above)
     * @param {Function} method function to call with params
     */
    this.method = function (modelName, modelApiName, model, path, verb, metadata, method) {
        const params = metadata.params;

        const handler = async function (context) {

            const args = parseArgs(params, context);

            // console.log('calling methodParams handler with args ', args);

            const result = await method(...args);
            return result;
        }

        // register this method with our explorer
        explorer.addMethod(modelName, modelApiName, model, path, verb, metadata);

        serverMethod(modelApiName, path, verb, handler);
    }
}

module.exports = ModelServer;