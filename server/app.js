const DbModel = require('./modelimpl/dbmodel');

const models = {};

const App = {
};

App.addModel = function(modelServer, db, modelClass, modelName, modelApiName) {
    const model = new DbModel(modelServer, db, modelName, modelApiName);
    model.extend(modelClass);

    models[modelName] = model;
};

App.getModel = function(name) {
    return models[name];
};

App.getModels = function() {
    return models;
};

module.exports = App;
