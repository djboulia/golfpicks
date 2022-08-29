const ModelServer = function (server, basePath) {
    /**
     * add handlers for all of the common CRUD methods
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

        this.method('', 'POST', create);
        this.method('', 'PUT', put);
        this.method('', 'GET', findAll);
        this.method('/findByIds', 'POST', findByIds);
        this.method('/:id', 'GET', findById);
        this.method('/:id', 'DELETE', deleteById);
        this.method('/:id/exists', 'GET', existsById);
    }

    /**
     * handles api methods for a model.  automatically 
     * appends the front end of the URL (e.g. api/Models)
     * to all requests
     * 
     * @param {String} path 
     * @param {String} verb 
     * @param {Function} fn 
     */
    this.method = function (path, verb, fn) {
        const fullPath = basePath + path;
        return server.method(fullPath, verb, fn);
    }

    /**
     * convenience method to call a model handler
     * with an id parameter
     * 
     * @param {String} path 
     * @param {String} verb 
     * @param {Function} method function taking an id parameter
     */
    this.methodId = function(path, verb, method) {

        const handler = async function (context) {
            const id = context.params.id;
    
            const result = await method(id);
            return result;
        }
    
        this.method(path, verb, handler);
    }
}

module.exports = ModelServer;