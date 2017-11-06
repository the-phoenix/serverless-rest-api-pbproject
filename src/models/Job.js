import { pick, omit } from 'ramda';
import uuidv1 from 'uuid/v1';
import dbClient from 'utils/db-client';

const JOB_TABLENAME = 'Jobs';

export default class JobModel {
  constructor() {
    this.dbClient = dbClient;
  }

  fetchById(id) {
    const params = {
      TableName: JOB_TABLENAME,
      IndexName: 'id-index',
      KeyConditionExpression: 'id = :hkey',
      ExpressionAttributeValues: {
        ':hkey': id
      }
    };

    return this
      .dbClient('query', params)
      .then(data => data.Items[0]);
  }

  fetchByFamilyId(familyId, lastEvaluatedKey, limit = 20) {
    const params = {
      TableName: JOB_TABLENAME,
      Limit: limit,
      ScanIndexForward: false,
      IndexName: 'familyId-modified-index',
      KeyConditionExpression: 'familyId = :hkey',
      ExpressionAttributeValues: {
        ':hkey': familyId
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    return this
      .dbClient('query', params)
      .then(data => ({ ...data, Limit: limit }));
  }

  fetchByFamilyMember(familyId, userId, lastEvaluatedKey, limit = 20) {
    const params = {
      TableName: JOB_TABLENAME,
      Limit: limit,
      ScanIndexForward: false,
      KeyConditionExpression: 'familyId = :hkey AND begins_with(childUserId__modifiedTimestamp, :rkey)',
      ExpressionAttributeValues: {
        ':hkey': familyId,
        ':rkey': userId
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    return this.dbClient('query', params);
  }

  create(jobData) {
    const now = new Date();
    const timestamp = now.getTime();

    const params = {
      TableName: JOB_TABLENAME,
      Item: {
        ...omit([''], jobData),
        id: uuidv1(),
        modified: now.toISOString(),
        modifiedTimestamp__familyId: `${timestamp}__${jobData.familyId}`,
        childUserId__modifiedTimestamp: `${jobData.childUserId}__${timestamp}`,
        history: {

        }
      }
    };

    return this.dbClient('put', params).then(() => params.Item);
  }
}
