const ModelServer = require("./modelserver");

const appInit = function () {
    let modelServer = undefined;

    const models = {};

    const app = {
    };

    app.path = function (baseUrl, staticDir) {
        modelServer = new ModelServer(baseUrl,staticDir);
    }

    app.explorer = function(name, path, protocols) {
        modelServer.enableExplorer(name, path, protocols);
    }

    app.listen = function(port) {
        modelServer.listen(port);
    }

    app.addModel = function (baseModel, modelExtender) {
        const modelName = baseModel.getModelName();

        // extend with server methods
        modelServer.extend(baseModel);

        // custom extensions for this model
        modelExtender(baseModel);

        models[modelName] = baseModel;
    };

    app.getModel = function (name) {
        return models[name];
    };

    app.getModels = function () {
        return models;
    };

    return app;
}

const app = module.exports = appInit();
