const ModelServer = function (server, basePath) {
    /**
     * internal method handler.  automatically 
     * appends the basePath (e.g. api/Models)
     * to all requests
     * 
     * @param {String} path 
     * @param {String} verb 
     * @param {Function} fn 
     */
    const serverMethod = function (path, verb, fn) {
        const fullPath = basePath + path;
        return server.method(fullPath, verb, fn);
    }

    /**
     * expose API endpoints for all of the common CRUD methods
     * for this model
     * 
     * @param {Object} model 
     */
    this.addCrudMethods = function (model) {

        const create = async function (context) {
            const body = context.body;

            if (body) {
                const result = await model.create(body);
                return result;
            } else {
                throw new Error('invalid body');
            }
        }

        const put = async function (context) {
            const body = context.body;

            if (body) {
                const result = await model.put(body);
                return result;
            } else {
                throw new Error('invalid body');
            }
        }

        const findAll = async function (context) {
            const result = await model.findAll();
            return result;
        }

        const findById = async function (context) {
            const id = context.params.id;

            if (id) {
                const result = await model.findById(id);
                return result;
            } else {
                throw new Error('invalid body');
            }
        }

        const findByIds = async function (context) {
            const ids = context.body;

            if (ids) {
                const result = await model.findByIds(ids);
                return result;
            } else {
                throw new Error('invalid body');
            }
        }

        const existsById = async function (context) {
            const id = context.params.id;

            if (id) {
                const result = await model.findById(id);
                return (result === undefined) ? false : true;
            } else {
                throw new Error('invalid body');
            }
        }

        const deleteById = async function (context) {
            const id = context.params.id;

            if (id) {
                const result = await model.deleteById(id);
                return result;
            } else {
                throw new Error('invalid body');
            }
        }

        serverMethod('', 'POST', create);
        serverMethod('', 'PUT', put);
        serverMethod('', 'GET', findAll);
        serverMethod('/findByIds', 'POST', findByIds);
        serverMethod('/:id', 'GET', findById);
        serverMethod('/:id', 'DELETE', deleteById);
        serverMethod('/:id/exists', 'GET', existsById);
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

                case 'body.param':
                    // return a specific parameter in the body
                    const body = context.body;

                    if (!body) throw new Error(`couldn't find param ${arg.name} in body`)

                    result.push(body[arg.name]);
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
    this.method = function (path, verb, params, method) {

        const handler = async function (context) {

            const args = parseArgs(params, context);

            // console.log('calling methodParams handler with args ', args);

            const result = await method(...args);
            return result;
        }

        serverMethod(path, verb, handler);
    }
}

module.exports = ModelServer;