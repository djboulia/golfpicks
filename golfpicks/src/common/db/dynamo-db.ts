/**
 *
 * Implements functions to create, read, update, delete our
 * Object Model in a Dynamo Database
 *
 */
import { v4 as uuidv4 } from 'uuid';

// import the aws sdk to use the dynamodb
// libraries in the app
import AWS from 'aws-sdk';

export type AWSCredentials = {
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type DynamoDBObject = {
  id: string;
  className: string;
  attributes: AWS.DynamoDB.DocumentClient.AttributeMap;
};

export class DynamoDb {
  private client: AWS.DynamoDB.DocumentClient;

  constructor(
    private credentials: AWSCredentials,
    private tableName: string,
  ) {
    AWS.config.update({
      region: this.credentials.region || 'us-east-1',
      accessKeyId: this.credentials.accessKeyId,
      secretAccessKey: this.credentials.secretAccessKey,
    });

    // create a new dynamodb client
    // which provides connectivity between the app and the db instance
    this.client = new AWS.DynamoDB.DocumentClient();
  }

  /**
   * Create a new object in the database.  Format will be:
   * id: unique id
   * className: the className supplied
   * attributes: the user data for this object
   *
   * @param {String} className class of this object
   * @param {Object} attributes the data for this object
   * @returns the object created
   */
  create(
    className: string,
    attributes: AWS.DynamoDB.DocumentClient.AttributeMap,
  ): Promise<DynamoDBObject> {
    return new Promise((resolve, reject) => {
      const obj = {
        id: uuidv4(),
        className: className,
        attributes: attributes,
      };

      const params = {
        TableName: this.tableName,
        Item: obj,
      };

      this.client.put(params, (err /*, data */) => {
        if (err) {
          console.error(
            'Unable to add item. Error JSON:',
            JSON.stringify(err, null, 2),
          );
          reject(err);
        } else {
          resolve(obj);
        }
      });
    });
  }

  /**
   * Update an existing object in the database
   *
   * @param {String} className class of this object
   * @param {Object} obj
   * @returns the object updated
   */
  put(className: string, obj: DynamoDBObject): Promise<DynamoDBObject> {
    return new Promise((resolve, reject) => {
      // validate that we have the necessary parameters
      if (!obj || !obj.id || !obj.className || !obj.attributes) {
        reject(new Error('put: invalid object: ' + JSON.stringify(obj)));
        return;
      }

      if (obj.className != className) {
        reject(new Error('put: invalid class name: ' + obj.className));
        return;
      }

      const params = {
        TableName: this.tableName,
        Item: obj,
      };

      this.client.put(params, (err /*, data */) => {
        if (err) {
          console.error(
            'Unable to add item. Error JSON:',
            JSON.stringify(err, null, 2),
          );
          reject(err);
        } else {
          resolve(obj);
        }
      });
    });
  }

  /**
   * Find a set of objects by their identifiers
   *
   * @param {String} className the className to filter by
   * @param {Array} ids the list of ids to search for
   * @returns an array of objects
   */
  findByIds(className: string, ids: string[]): Promise<DynamoDBObject[]> {
    return new Promise((resolve, reject) => {
      const idObject = { ':className': className };
      let index = 0;
      ids.forEach(function (value) {
        index++;
        const idKey = ':idvalue' + index;
        idObject[idKey.toString()] = value;
      });

      const params = {
        TableName: this.tableName,
        FilterExpression:
          'className = :className AND id IN (' +
          Object.keys(idObject).toString() +
          ')',
        ExpressionAttributeValues: idObject,
      };

      this.client.scan(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const items = data.Items ? [...data.Items] : [];
          resolve(items as DynamoDBObject[]);
        }
      });
    });
  }

  /**
   * Find an object in the database by its id
   *
   * @param {String} className the className to filter by
   * @param {String} key the id to search for
   * @returns an object
   */
  findById(
    className: string,
    key: string,
  ): Promise<DynamoDBObject | undefined> {
    return new Promise((resolve, reject) => {
      console.log('findById key: ', key);

      const params = {
        TableName: this.tableName,
        Key: {
          id: key,
        },
      };

      this.client.get(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          // console.log('findById data: ', data);

          if (data.Item?.className !== className) {
            const msg = `findByid: classNames don't match! expected ${className}, got ${data.Item?.className}`;
            console.error(msg);
            reject(new Error(msg));
          }
          resolve(data.Item as DynamoDBObject | undefined);
        }
      });
    });
  }

  /**
   * Find all objects of the specified className
   *
   * @param {String} className the className to filter by
   * @returns an array of objects
   */
  findAll(className: string): Promise<DynamoDBObject[]> {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'className = :className',
        ExpressionAttributeValues: { ':className': className },
      };

      this.client.scan(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const items = data.Items ? [...data.Items] : [];
          resolve(items as DynamoDBObject[]);
        }
      });
    });
  }

  /**
   * Search the class for a specific attributes containing
   * exactly the value specified.  For instance, to search for all
   * records where admin = true, fields would be { "admin" : true }
   * To search for a specific username attribute,
   * use { "username" : "djboulia@gmail.com"}
   *
   * @param {String} className
   * @param {Object} fields object properties will be the fields to match object value
   * @returns an array of objects that match
   */
  findByFields(
    className: string,
    fields: Record<string, string | number | boolean>,
  ): Promise<DynamoDBObject[]> {
    let filterExpression = 'className = :className';
    const expressionAttributeValues = { ':className': className };

    return new Promise((resolve, reject) => {
      for (const [key, value] of Object.entries(fields)) {
        const filterName = `:${key}`;

        filterExpression += ` AND attributes.${key} = ${filterName}`;
        expressionAttributeValues[filterName] = value;
      }

      // console.log('filter :', filterExpression);
      // console.log('expresssion: ', expressionAttributeValues);

      const params = {
        TableName: this.tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      };

      this.client.scan(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const items = data.Items ? [...data.Items] : [];
          resolve(items as DynamoDBObject[]);
        }
      });
    });
  }
  /**
   * Deletes an object in the database matching the id
   *
   * @param {String} className the className to filter by
   * @param {String} key the id of the object
   * @returns true if successful, false otherwise
   */
  deleteById(_: string, key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
        Key: {
          id: key,
        },
      };

      this.client.delete(params, (err /*, data */) => {
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
