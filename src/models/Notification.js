// import { pick } from 'ramda';
import uuidv1 from 'uuid/v1';
import dbClient from 'utils/db-client';

const NOTIFICATION = 'Notifications';

export default class NotificationModel {
  constructor() {
    this.dbClient = dbClient;
  }

  fetchByUser(userId, lastEvaluatedKey, limit = 20) {
    const params = {
      TableName: NOTIFICATION,
      Limit: limit,
      ScanIndexForward: false,
      KeyConditionExpression: 'userId = :hkey',
      ExpressionAttributeValues: {
        ':hkey': `${userId}`,
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    return this.dbClient('query', params).then(({ Items }) => Items);
  }

  create(userId, content, familyId = 'NO_FAMILY_ID', meta = {}) {
    const now = new Date();
    const params = {
      TableName: NOTIFICATION,
      Item: {
        id: uuidv1(),
        userId,
        content,
        familyId,
        created: now.toISOString(),
        meta
      }
    };

    return this.dbClient('put', params).then(() => params.Item);
  }

  markOneAsRead(notiId) {
    const now = new Date();

    const params = {
      TableName: NOTIFICATION,
      IndexName: 'id-index',
      Key: {
        id: notiId
      },
      UpdateExpression: [
        'SET alreadyRead = :read',
        'modified = :m'
      ].join(', '),
      ExpressionAttributeValues: {
        ':read': true,
        ':m': now.toISOString(),
      },
      ReturnValues: 'ALL_NEW'
    };

    return this.dbClient('update', params).then(data => data.Attributes);
  }
}
