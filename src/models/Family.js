import { CognitoIdentityServiceProvider } from 'aws-sdk';
import dbClient from 'utils/db-client';

const FAMILY_TABLENAME = 'families';

export default class FamilyModel {
  constructor() {
    this.dbClient = dbClient;
    this.cognito = new CognitoIdentityServiceProvider();
  }

  fetchById(id) {
    const params = {
      TableName: FAMILY_TABLENAME,
      KeyConditionExpression: 'id = :hkey',
      ExpressionAttributeValues: {
        ':hkey': id
      }
    };

    return this
      .dbClient('query', params);
  }

  fetchByMember(memberId) {
    const params = {
      TableName: FAMILY_TABLENAME,
      IndexName: 'id-userId-index',
      KeyConditionExpression: 'userId = :hkey',
      ExpressionAttributeValues: {
        ':hkey': memberId
      }
    };

    return this.dbClient('query', params);
  }
}
