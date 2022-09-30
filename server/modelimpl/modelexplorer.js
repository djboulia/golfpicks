/**
 * Track models and methods against them to construct 
 * the Swagger javascript object based on the methods we've 
 * defined in our model.
 */

const ModelExplorer = function (appName, baseUrl) {
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

    const getParameters = function (method) {
        const params = method.params;
        let data = '';

        if (params.length > 0) {
            data += '<p>Parameters:</p>';

            for (let i = 0; i < params.length; i++) {
                const param = params[i];
                data += `<table>`;
                data += `<tr><th>Parameter</th><th>Parameter Type</th><th>Data Type</th></tr>`;
                data += `<tr><td>${param.name}</td><td>${param.source}</td><td>${param.type}</td></tr>`;
                data += '</table><p/>';
            }
        }

        return data;
    }

    const addModelDefinition = function (swaggerDoc, model) {
        const modelName = model.getModelName();

        swaggerDoc.definitions[modelName] = {
            "type": "object",
            "required": [
                "id",
                "name"
            ],
            "properties": {
                "id": {
                    "type": "integer",
                    "format": "int64"
                },
                "name": {
                    "type": "string"
                },
                "tag": {
                    "type": "string"
                }
            }
        }
    }

    const addSchemaDefinition = function (definitions, param) {
        const schema = param.schema;

        const obj = {
            "type": "object",
            "required": [],
            "properties": {}
        }

        const properties = schema.properties;

        for (const name in properties) {
            const property = properties[name];

            if (property.required) {
                obj.required.push(name);
            }

            obj.properties[name] = {
                "type" : property.type
            }
        }

        definitions[schema.name] = obj;

    }

    const addParametersDefinition = function (pathDefinition, definitions, method) {
        const params = method.params;

        // console.log('params: ', params);

        for (let i = 0; i < params.length; i++) {
            const param = params[i];

            const swaggerParams = pathDefinition.parameters || [];

            switch (param.source) {
                case 'param':
                    swaggerParams.push(
                        {
                            "name": param.name,
                            "in": "path",
                            "description": "",
                            "required": true,
                            "type": param.type
                        });
                    break;

                case 'query':
                    swaggerParams.push(
                        {
                            "name": param.name,
                            "in": "query",
                            "description": "",
                            "required": true,
                            "type": param.type
                        });
                    break;

                case 'body':
                    const bodyParam = {
                        "name": param.name,
                        "in": "body",
                        "description": "",
                        "required": true,
                        "type": param.type
                    }

                    if (param.schema) {
                        bodyParam.schema = {
                            "$ref": `#/definitions/${param.schema.name}`
                        }

                        addSchemaDefinition(definitions, param);
                    }

                    swaggerParams.push(
                        bodyParam
                    );

                    break;
            }

            pathDefinition.parameters = swaggerParams;
        }
    }

    /**
     * convert from express format for path values, e.g. /Games/:id
     * to Swagger format e.g. /Games/{id}
     * 
     * @param {String} path the path to convert
     */
    const convertPath = function (path) {
        const regex = /:[A-Za-z0-9_]*/g;
        const params = path.match(regex);

        if (!params) {
            // no parameter values
            return path;
        }

        // console.log('found parameters: ', params);

        let newPath = path;

        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const swaggerParam = '{' + param.substr(1) + '}';

            newPath = newPath.replace(param, swaggerParam);
        }

        // console.log('newPath ' + newPath);
        return newPath;
    }

    const buildPath = function (method) {
        const model = method.model;
        const path = convertPath(method.path);

        const fullPath = '/' + model.getModelNamePlural() + path
        return fullPath;
    }

    const addMethodDefinition = function (swaggerDoc, method) {
        const model = method.model;
        const modelName = model.getModelName();
        const path = buildPath(method);
        const verb = method.verb.toLowerCase();

        const pathDefinition = swaggerDoc.paths[path] || {};
        pathDefinition[verb] = {
            "description": "Returns all gamers",
            "produces": [
                "application/json"
            ],
            "responses": {
                "200": {
                    "description": "A list of gamers.",
                    "schema": {
                        "type": "array",
                        "items": {
                            "$ref": `#/definitions/${modelName}`
                        }
                    }
                }
            }
        }

        addParametersDefinition(pathDefinition[verb], swaggerDoc.definitions, method);

        swaggerDoc.paths[path] = pathDefinition;
    }


    const addMethodsDefinition = function (swaggerDoc, methods) {

        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];

            addMethodDefinition(swaggerDoc, method);
        }
    }

    this.getSwaggerDoc = function () {
        const swaggerDoc = {
            "swagger": "2.0",
            "info": {
                "version": "1.0.0",
                "title": appName,
                "description": "Server side API explorer",
                "contact": {
                    "name": "Don Boulia"
                }
            },
            "host": "example.com",  // will be replaced dynamically
            "basePath": "/api",
            "schemes": [            // will be replaced dynamically
                "http"
            ],
            "consumes": [
                "application/json"
            ],
            "produces": [
                "application/json"
            ],
            "paths": {
            },
            "definitions": {
            }
        };

        for (model in models) {

            const methods = models[model];

            if (methods.length > 0) {
                const model = methods[0].model;

                addModelDefinition(swaggerDoc, model);

                addMethodsDefinition(swaggerDoc, methods);

            }
        }

        // console.log(swaggerDoc);

        return swaggerDoc;
    }
}

module.exports = ModelExplorer;