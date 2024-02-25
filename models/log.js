/**
 * Connect to our data source and expose API end points
 * for this model.
 *
 */

const Log = function (model) {
  // expose the create, read, update methods from this model
  model.addCrudMethods();
};

module.exports = Log;
