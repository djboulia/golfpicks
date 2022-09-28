/**
 * Implement a viewer and tester for API functions
 */

const ModelExplorer = function (server, baseUrl) {
    const models = {};

    this.addMethod = function (model, path, verb, params) {
        const modelApiName = model.getModelNamePlural();

        const methods = models[modelApiName] || [];

        methods.push({
            model: model,
            path: path,
            verb: verb,
            params: params
        });

        models[modelApiName] = methods;
    };

    const getParameters = function(method) {
        const params = method.params;
        let data = '';

        if (params.length > 0) {
            data += '<p>Parameters:</p>';

            for (let i=0; i<params.length; i++) {
                const param = params[i];
                data += `<table>`;
                data += `<tr><th>Parameter</th><th>Parameter Type</th><th>Data Type</th></tr>`;
                data += `<tr><td>${param.name}</td><td>${param.source}</td><td>${param.type}</td></tr>`;
                data += '</table><p/>';
            }
        } 

        return data;
    }

    /**
     * print out the model's name and methods
     * 
     * @param {Array} model 
     */
    const modelToHtml = function(modelName, modelApiName, methods) {
        let data = `<p><b>Model: ${modelName}</b></p>`;

        for (let i=0; i<methods.length; i++) {
            const method = methods[i];

            data += `<table><tr><td>${method.verb}</td><td>${baseUrl}/${modelApiName}${method.path}</td></tr></table>`;
            data += getParameters(method);
        }

        return data;
    }

    /**
     * add explorer entry points to this server
     * 
     * @param {Object} server 
     * @param {Sttring} basePath 
     */
    this.enable = function (basePath) {

        const showMethods = async function (context) {

            let data = '';

            for (const modelName in models ) {
                const methods = models[modelName];

                if (methods.length >0) {
                    const model = methods[0].model;

                    const modelName = model.getModelName();
                    const modelApiName = model.getModelNamePlural();

                    data += modelToHtml( modelName, modelApiName, methods);

                }
            }

            const result = {
                type: 'text/html',
                data: `<html><link href='/explorer/css/default.css' media='screen' rel='stylesheet' type='text/css'/> ${data}</html>`
            }

            return result;
        }

        server.rawMethod(basePath + '/explorer', 'GET', showMethods);

        // set up static directory for serving explorer css and js files
        server.static('/explorer', __dirname + '/explorer'); 
        server.static('/explorer/css', __dirname + '/explorer/css'); 
        server.static('/explorer/js', __dirname + '/explorer/js'); 
    };
}

module.exports = ModelExplorer;