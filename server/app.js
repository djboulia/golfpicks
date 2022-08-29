const ModelFactory = require('./modelimpl/modelfactory');
const ModelServer = require('./modelimpl/modelserver');

const models = {};

const App = {
};

App.addModel = function(server, db, baseUrl, modelClass, modelName, pluralModelName) {
    const modelServer = new ModelServer(server, `${baseUrl}/${pluralModelName}`);
    const model = new ModelFactory(modelName, db);
    const modelApi = new modelClass(modelServer, model);

    models[modelName] = model;
};

App.getModel = function(name) {
    return models[name];
};

App.getModels = function() {
    return models;
};

module.exports = App;
