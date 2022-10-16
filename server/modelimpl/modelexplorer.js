/**
 * Track models and methods against them to construct 
 * the Swagger javascript object based on the methods we've 
 * defined in our model.
 */

const ModelExplorer = function () {
    const models = {};

    this.addMethod = function (modelName, modelApiName, model, path, verb, metadata) {

        const methods = models[modelApiName] || [];

        methods.push({
            modelName: modelName,
            modelApiName: modelApiName,
            model: model,
            path: path,
            verb: verb,
            metadata: metadata
        });

        models[modelApiName] = methods;
    };

    const addModelDefinition = function (swaggerDoc, modelName, model) {

        swaggerDoc.tags[modelName] = {
            "name": modelName,
            "description": "Model definition",
        }

        swaggerDoc.definitions[modelName] = {
            "type": "object",
            "required": [
                "id",
                "name"
            ],
            "properties": {
                "id": {
                    "type": "integer",
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
                "type": property.type
            }
        }

        definitions[schema.name] = obj;

    }

    const addParametersDefinition = function (pathDefinition, definitions, method) {
        const metadata = method.metadata;
        const params = metadata.params;

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
            const swaggerParam = '{' + param.substring(1) + '}';

            newPath = newPath.replace(param, swaggerParam);
        }

        // console.log('newPath ' + newPath);
        return newPath;
    }

    const buildPath = function (method) {
        const modelApiName = method.modelApiName;
        const path = convertPath(method.path);

        const fullPath = '/' + modelApiName + path
        return fullPath;
    }

    const parseResponses = function(responses) {
        const result = {};

        for (let i=0; i<responses.length; i++) {
            const response = responses[i];

            result[response.code] = {
                description : response.description,
                schema : response.schema
            }
        }

        return result;
    }

    const addMethodDefinition = function (swaggerDoc, method) {
        const modelName = method.modelName;
        const path = buildPath(method);
        const verb = method.verb.toLowerCase();
        const metadata = method.metadata;
        const description = metadata.description || "";
        const responses = parseResponses(metadata.responses || []);
        const pathDefinition = swaggerDoc.paths[path] || {};

        pathDefinition[verb] = {
            "tags": [
                modelName
            ],
            "description": description,
            "produces": [
                "application/json"
            ],
            "responses": responses
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

    this.getSwaggerDoc = function (appName) {
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
            "tags": {
            },
            "paths": {
            },
            "definitions": {
            }
        };

        for (model in models) {

            const methods = models[model];

            if (methods.length > 0) {
                const model = methods[0].model;
                const modelName = methods[0].modelName;

                addModelDefinition(swaggerDoc, modelName, model);

                addMethodsDefinition(swaggerDoc, methods);

            }
        }

        // console.log(swaggerDoc);

        return swaggerDoc;
    }
}

module.exports = ModelExplorer;