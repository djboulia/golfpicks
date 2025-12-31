/**
 *
 * Implements functions to create, read, update, delete our
 * Object Model in a Dynamo Database
 *
 */

import { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DynamoDb } from 'src/common/db/dynamo-db';

export type GolfPicksAttributes = Record<string, NativeAttributeValue>;

type GolfPicksDbObject = {
  id: string;
  className: string;
  attributes: GolfPicksAttributes;
};

export class GolfPicksDb {
  private db: DynamoDb;

  constructor(
    private readonly configService: ConfigService,
    private tableName: string,
  ) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are not set in environment variables');
    }

    const credentials = {
      region: this.configService.get<string>('AWS_REGION'),
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    };

    this.db = new DynamoDb(credentials, this.tableName);
  }

  /**
   * the backend database stores multiple models in one table, using
   * the special className field to classify different models.  the
   * id field uniquely identifies each model in the table.  all user
   * data for the record is stored in the "attributes" field like this:
   * {
   *      id: xxx
   *      className:
   *      attributes: {
   *          modelData1: 'foo',
   *          modelData2: 'bar'
   *      }
   * }
   *
   * this class implements a single model representing the data
   * we don't want to expose classNme or attributes, so we simply
   * return the attributes data and insert the "id" field into it.
   * so flatten model takes the structure above and converts it to:
   *
   * {
   *      id: xxx
   *      modelData1: 'foo',
   *      modelData2: 'bar'
   * }
   *
   * @param {*} dbObj db model data to flatten
   */
  private flattenModel(dbObj: GolfPicksDbObject) {
    const attributes = dbObj?.attributes;
    if (attributes) {
      attributes.id = dbObj.id;
    }

    return attributes;
  }

  /**
   * for methods that return an array of records,
   * flatten each one and return
   *
   * @param {Array} items an array of db records
   * @returns an array of flattened db records
   */
  private flattenArray(items: GolfPicksDbObject[]) {
    if (!items || items.length === 0) {
      return [];
    }

    const result: GolfPicksAttributes[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      result.push(this.flattenModel(item));
    }

    return result;
  }

  /**
   * for the put operation, we need to restore the flattened data
   * to the format the backend database will recognize, e.g.
   *
   * {
   *      id:
   *      className:
   *      attributes: {}
   * }
   *
   * @param {*} obj flattened model data
   * @returns dbObj
   */
  private restoreModel(
    className: string,
    obj: GolfPicksAttributes,
  ): GolfPicksDbObject {
    const id = obj.id as string;

    // remove the id field from the object before passing it
    // to the back end database since the dbObj has its own id field
    const attributes: Omit<typeof obj, 'id'> & { id?: string } = { ...obj };
    delete attributes.id;

    const dbObj = {
      id: id,
      className: className,
      attributes: attributes,
    };

    return dbObj;
  }

  async create(className: string, data: GolfPicksAttributes) {
    const obj = this.restoreModel(className, data);

    const result = await this.db.create(className, obj.attributes);
    return this.flattenModel(result);
  }

  async put(className: string, data: GolfPicksAttributes) {
    const obj = this.restoreModel(className, data);
    console.log('put object: ', obj);

    const result = await this.db.put(className, obj);
    return this.flattenModel(result);
  }

  async findByIds(className: string, ids: string[]) {
    const results = await this.db.findByIds(className, ids);
    return this.flattenArray(results);
  }

  async findById(className: string, id: string) {
    const result = await this.db.findById(className, id);
    return result ? this.flattenModel(result) : undefined;
  }

  async findAll(className: string) {
    const results = await this.db.findAll(className);
    return this.flattenArray(results);
  }

  async findByFields(
    className: string,
    fields: Record<string, string | number | boolean>,
  ) {
    const results = await this.db.findByFields(className, fields);
    return this.flattenArray(results);
  }

  async deleteById(className: string, id: string) {
    const result = await this.db.deleteById(className, id);
    return result;
  }
}
