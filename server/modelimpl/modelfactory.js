const Model = function( modelName, db ) {
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

}

module.exports = Model;