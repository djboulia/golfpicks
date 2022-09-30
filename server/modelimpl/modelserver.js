const ModelExplorer = require('./modelexplorer');

const ModelServer = function(appName, server, basePath) {

    const explorer = new ModelExplorer(appName, basePath);

    /**
     * Call this to hang an API explorer endpoint at the supplied
     * path.  This will provide a UI for accessing all of the API 
     * endpoints.
     * 
     * @param {String} path 
     */
    this.enableExplorer = function(path) {
        const doc = explorer.getSwaggerDoc();

        server.explorer(path, doc);
    }

    /**
     * internal method handler.  automatically 
     * appends the basePath (e.g. api/Models)
     * to all requests
     * 
     * @param {String} path 
     * @param {String} verb 
     * @param {Function} fn 
     */
    const serverMethod = function (model, path, verb, fn) {
        const modelApiName = model.getModelNamePlural();

        const fullPath = `${basePath}/${modelApiName}${path}`;
        return server.method(fullPath, verb, fn);
    }

    /**
     * expose API endpoints for all of the common CRUD methods
     * for this model
     * 
     * @param {Object} model 
     */
    this.addCrudMethods = function (model) {

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
            model,
            '',
            'POST',
            [
                {
                    name: 'record',
                    source: 'body',
                    type: 'object'
                },
            ],
            create);

        this.method(
            model,
            '',
            'PUT',
            [
                {
                    name: 'record',
                    source: 'body',
                    type: 'object'
                },
            ],
            put);

        this.method(
            model,
            '',
            'GET',
            [
            ],
            findAll);

        this.method(
            model,
            '/findByIds',
            'POST',
            [
                {
                    name: 'ids',
                    source: 'body',
                    type: 'array'
                },
            ],
            findByIds);

        this.method(
            model,
            '/:id',
            'GET',
            [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ],
            findById);

        this.method(
            model,
            '/:id',
            'DELETE',
            [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ],
            deleteById);

        this.method(
            model,
            '/:id/exists',
            'GET',
            [
                {
                    name: 'id',
                    source: 'param',
                    type: 'string'
                },
            ],
            existsById);
    }

    //
    // example of the format of the params object expected 
    // in the method entry point below
    //
    const sampleArgs = [
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
        },
        {
            name: 'user',
            source: 'body.param',
            type: 'string'
        }
    ];

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
     * @param {Object} params which arguments to pass to the method (see above)
     * @param {Function} method function to call with params
     */
    this.method = function (model, path, verb, params, method) {

        const handler = async function (context) {

            const args = parseArgs(params, context);

            // console.log('calling methodParams handler with args ', args);

            const result = await method(...args);
            return result;
        }

        // register this method with our explorer
        explorer.addMethod(model, path, verb, params);

        serverMethod(model, path, verb, handler);
    }
}

module.exports = ModelServer;