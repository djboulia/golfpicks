/**
 * implements a CRUD model backed by a database
 * 
 * @param {Object} modelServer server to expose API endpoints for this model
 * @param {Object} db backend database implementation
 * @param {String} modelName the name of this model
 * @param {String} modelNamePlural the plural form of the model name
 */
const DbModel = function( modelServer, db, modelName, modelNamePural ) {

    /**
     * 
     * @returns the model name
     */
    this.getModelName = function() {
        return modelName;
    }

    /**
     * 
     * @returns plural version of this model name
     */
    this.getModelNamePlural = function() {
        return modelNamePural;
    }

    this.create = async function(attributes) {
        const result = await db.create(modelName, attributes);
        return result;
    }

    this.put = async function(obj) {
        const result = await db.put(obj);
        return result;   
    }

    this.findByIds = async function(ids) {
        const result = await db.findByIds(ids);
        return result;   
    }

    this.findById = async function(id) {
        const result = await db.findById(id);
        return result;   
    }

    this.findAll = async function() {
        const result = await db.findAll(modelName);
        return result;   
    }

    this.deleteById = async function(id) {
        const result = await db.deleteById(id);
        return result;   
    }

    /**
     * Method to extend the base model by adding additional methods
     * and API entry points.
     * 
     * @param {Object} modelClass 
     * @returns 
     */
    this.extend = function(modelClass) {
        return new modelClass(modelServer, this);
    }

}

module.exports = DbModel;