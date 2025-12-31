/**
 *
 * Implements functions to create, read, update, delete our
 * Object Model in a Dynamo Database
 *
 */
import { v4 as uuidv4 } from 'uuid';

// import the aws sdk to use the dynamodb
// libraries in the app

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export type AWSCredentials = {
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type DynamoDBObject = {
  id: string;
  className: string;
  attributes: Record<string, NativeAttributeValue>;
};

export class DynamoDb {
  private client: DynamoDBDocumentClient;

  constructor(
    private credentials: AWSCredentials,
    private tableName: string,
  ) {
    // JS SDK v3 does not support global configuration.
    // Codemod has attempted to pass values to each service client in this file.
    // You may need to update clients outside of this file, if they use global config.
    // AWS.config.update({
    //   region: this.credentials.region || 'us-east-1',
    //   accessKeyId: this.credentials.accessKeyId,
    //   secretAccessKey: this.credentials.secretAccessKey,
    // });

    // create a new dynamodb client
    // which provides connectivity between the app and the db instance
    const dbClient = new DynamoDBClient({
      region: this.credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
      },
    });

    this.client = DynamoDBDocumentClient.from(dbClient);
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
  async create(
    className: string,
    attributes: Record<string, NativeAttributeValue>,
  ): Promise<DynamoDBObject> {
    const obj = {
      id: uuidv4(),
      className: className,
      attributes: attributes,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: obj,
    });

    await this.client.send(command).catch((err) => {
      console.error(
        'Unable to add item. Error JSON:',
        JSON.stringify(err, null, 2),
      );
      return undefined;
    });
    return obj;
  }

  /**
   * Update an existing object in the database
   *
   * @param {String} className class of this object
   * @param {Object} obj
   * @returns the object updated
   */
  async put(className: string, obj: DynamoDBObject): Promise<DynamoDBObject> {
    // validate that we have the necessary parameters
    if (!obj || !obj.id || !obj.className || !obj.attributes) {
      throw new Error('put: invalid object: ' + JSON.stringify(obj));
    }

    if (obj.className != className) {
      throw new Error('put: invalid class name: ' + obj.className);
    }

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: obj,
      });

      await this.client.send(command);
      return obj;
    } catch (error) {
      console.error('Error in put: ', error);
      throw error;
    }
  }

  /**
   * Find a set of objects by their identifiers
   *
   * @param {String} className the className to filter by
   * @param {Array} ids the list of ids to search for
   * @returns an array of objects
   */
  async findByIds(className: string, ids: string[]): Promise<DynamoDBObject[]> {
    const idObject = { ':className': className };
    let index = 0;
    ids.forEach(function (value) {
      index++;
      const idKey = ':idvalue' + index;
      idObject[idKey.toString()] = value;
    });

    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression:
          'className = :className AND id IN (' +
          Object.keys(idObject).toString() +
          ')',
        ExpressionAttributeValues: idObject,
      });

      const data = await this.client.send(command);
      return data.Items ? (data.Items as DynamoDBObject[]) : [];
    } catch (error) {
      console.error('Error in findByIds: ', error);
      throw error;
    }
  }

  /**
   * Find an object in the database by its id
   *
   * @param {String} className the className to filter by
   * @param {String} key the id to search for
   * @returns an object
   */
  async findById(
    className: string,
    key: string,
  ): Promise<DynamoDBObject | undefined> {
    console.log('findById key: ', key);

    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: key,
        },
      });

      const data = await this.client.send(command);

      if (data.Item?.className !== className) {
        const msg = `findByid: classNames don't match! expected ${className}, got ${data.Item?.className}`;
        console.error(msg);
        throw new Error(msg);
      }

      return data.Item as DynamoDBObject | undefined;
    } catch (error) {
      console.error('Error in findById: ', error);
      throw error;
    }
  }

  /**
   * Find all objects of the specified className
   *
   * @param {String} className the className to filter by
   * @returns an array of objects
   */
  async findAll(className: string): Promise<DynamoDBObject[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'className = :className',
        ExpressionAttributeValues: { ':className': className },
      });

      const data = await this.client.send(command);
      const items = data.Items ? [...data.Items] : [];
      return items as DynamoDBObject[];
    } catch (error) {
      console.error('Error in findAll: ', error);
      throw error;
    }
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
  async findByFields(
    className: string,
    fields: Record<string, string | number | boolean>,
  ): Promise<DynamoDBObject[]> {
    let filterExpression = 'className = :className';
    const expressionAttributeValues = { ':className': className };

    for (const [key, value] of Object.entries(fields)) {
      const filterName = `:${key}`;

      filterExpression += ` AND attributes.${key} = ${filterName}`;
      expressionAttributeValues[filterName] = value;
    }

    // console.log('filter :', filterExpression);
    // console.log('expresssion: ', expressionAttributeValues);

    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      const data = await this.client.send(command);

      const items = data.Items ? [...data.Items] : [];
      return items as DynamoDBObject[];
    } catch (error) {
      console.error('Error in findByFields: ', error);
      throw error;
    }
  }
  /**
   * Deletes an object in the database matching the id
   *
   * @param {String} className the className to filter by
   * @param {String} key the id of the object
   * @returns true if successful, false otherwise
   */
  async deleteById(_: string, key: string): Promise<boolean> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: {
          id: key,
        },
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error in deleteById: ', error);
      return false;
    }
  }
}
