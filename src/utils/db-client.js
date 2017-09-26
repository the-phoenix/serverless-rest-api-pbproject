import { DynamoDB } from 'aws-sdk';
import R from 'ramda';

const dynamodbOfflineOptions = {
  region: 'localhost',
  endpoint: 'http://localhost:8000'
};
export const isOffline = () => process.env.IS_OFFLINE;

export const db = isOffline()
  ? new DynamoDB.DocumentClient(dynamodbOfflineOptions)
  : new DynamoDB.DocumentClient();

export const DB_PREFIX = process.env.IS_OFFLINE ? `${process.env.SERVICE_NAME}-dev` : process.env.DB_PREFIX;

const mapKeys = R.curry((fn, obj) => R.reduce((acc, key) => {
  acc[fn(key)] = obj[key];
  return acc;
}, {}, R.keys(obj)));

const prefixTableName4Normal = params => ({ ...params, TableName: `${DB_PREFIX}-${params.TableName}` });
const prefixTableName4Batch = params => ({
  ...params,
  RequestItems: mapKeys(tableName => `${DB_PREFIX}-${tableName}`, params.RequestItems)
});

const client = (action, params) => {
  const gParams = action.startsWith('batch')
    ? prefixTableName4Batch(params)
    : prefixTableName4Normal(params);

  return db[action](gParams).promise();
};

export default client;
