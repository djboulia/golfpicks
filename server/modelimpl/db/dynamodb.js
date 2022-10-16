/**
 * 
 * Implements functions to create, read, update, delete our
 * Object Model in a Dynamo Database
 * 
 */
 const { v4: uuidv4 } = require('uuid');

 // import the aws sdk to use the dynamodb
 // libraries in the app
 const AWS = require('aws-sdk');
 
 const DynamoModel = function (credentials, tableName) {
     // update the region to 
     // where dynamodb is hosted
     AWS.config.update({
         region: "us-east-1",
         accessKeyId: credentials.accessKeyId,
         secretAccessKey: credentials.secretAccessKey
     });
 
     // create a new dynamodb client
     // which provides connectivity between the app and the db instance
     const client = new AWS.DynamoDB.DocumentClient();
 
     this.create = function (className, attributes) {
         return new Promise((resolve, reject) => {
             const obj = {};
 
             obj.id = uuidv4();
             obj.className = className;
             obj.attributes = attributes;
 
             const params = {
                 TableName: tableName,
                 Item: obj
             };
 
             client.put(params, (err, data) => {
                 if (err) {
                     console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                     reject(err);
                 } else {
                     resolve(obj);
                 }
             });
         });
     }
 
     this.put = function (obj) {
 
         return new Promise((resolve, reject) => {
             // validate that we have the necessary parameters
             if (!obj || !obj.id || !obj.className || !obj.attributes) {
                 reject('put: invalid object: ', obj);
                 return;
             }
 
             const params = {
                 TableName: tableName,
                 Item: obj
             };
 
             client.put(params, (err, data) => {
                 if (err) {
                     console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                     reject(err);
                 } else {
                     resolve(obj);
                 }
             });
         });
     }
 
     this.findByIds = function (ids) {
         return new Promise((resolve, reject) => {
 
             const idObject = {};
             let index = 0;
             ids.forEach(function (value) {
                 index++;
                 const idKey = ":idvalue" + index;
                 idObject[idKey.toString()] = value;
             });
 
             const params = {
                 TableName: tableName,
                 FilterExpression: "id IN (" + Object.keys(idObject).toString() + ")",
                 ExpressionAttributeValues: idObject
             };
 
             client.scan(params, (err, data) => {
                 if (err) {
                     console.log(err);
                     reject(err);
                 } else {
                     var items = [];
                     for (var i in data.Items)
                         items.push(data.Items[i]);
 
                     resolve(items);
                 }
             });
         });
     }
 
     this.findById = function (key) {
 
         return new Promise((resolve, reject) => {
 
             const params = {
                 TableName: tableName,
                 Key: {
                     'id': key
                 }
             };
 
             client.get(params, (err, data) => {
                 if (err) {
                     console.log(err);
                     reject(err);
                 } else {
                     // var items = [];
                     // for (var i in data.Items)
                     //     items.push(data.Items[i]);
 
                     resolve(data.Item);
                 }
             });
         });
     }
 
     this.findAll = function (className) {
         return new Promise((resolve, reject) => {
             const params = {
                 TableName: tableName,
                 FilterExpression: "className = :className",
                 ExpressionAttributeValues: { ':className': className }
             };
 
             client.scan(params, (err, data) => {
                 if (err) {
                     console.log(err);
                     reject(err);
                 } else {
                     var items = [];
                     for (var i in data.Items)
                         items.push(data.Items[i]);
 
                     resolve(items);
                 }
             });
         });
     }
 
     this.deleteById = function (key) {
 
         return new Promise((resolve, reject) => {
 
             const params = {
                 TableName: tableName,
                 Key: {
                     'id': key
                 }
             };
 
             client.delete(params, (err, data) => {
                 if (err) {
                     console.log(err);
                     reject(err);
                 } else {
                     resolve(true);
                 }
             });
         });
     }
 }
 
 module.exports = DynamoModel;
 
 
 
 