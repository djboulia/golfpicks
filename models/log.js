/**
 * Connect to our data source and expose API end points
 * for this model.
 * 
 */

const Log = function (modelServer, model) {
    // expose the create, read, update methods from this model
    modelServer.addCrudMethods(model);
}

module.exports = Log;