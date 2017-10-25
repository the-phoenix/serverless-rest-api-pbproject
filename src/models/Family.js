import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { pick } from 'ramda';
import uuidv1 from 'uuid/v1';
import dbClient from 'utils/db-client';

const FAMILY_TABLENAME = 'Families';
const FAMILY_USER_TABLENAME = 'FamiliesUsers';

export default class FamilyModel {
  constructor() {
    this.dbClient = dbClient;
    this.cognito = new CognitoIdentityServiceProvider();
  }

  fetchById(id) {
    const params = {
      TableName: FAMILY_TABLENAME,
      Key: { id }
    };

    return this
      .dbClient('get', params);
  }

  fetchMembersById(id) {
    const params = {
      TableName: FAMILY_USER_TABLENAME,
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
      TableName: FAMILY_USER_TABLENAME,
      IndexName: 'id-userId-index',
      KeyConditionExpression: 'userId = :hkey',
      ExpressionAttributeValues: {
        ':hkey': memberId
      }
    };

    return this.dbClient('query', params);
  }

  createFamily(familyAdminUser) {
    const WHITE_LIST = ['userId', 'email'];
    const params = {
      TableName: FAMILY_TABLENAME,
      Item: {
        id: uuidv1(),
        name: `${familyAdminUser.name}'s Family`,
        created: new Date(),
        adminSummary: pick(WHITE_LIST, familyAdminUser)
      }
    };

    return this.dbClient('put', params);
  }

  joinFamily(familyId, members) {
    const joinPromises = members.map((member) => {
      const params = {
        TableName: FAMILY_USER_TABLENAME,
        Item: {
          id: familyId,
          userId: member.userId,
          created: new Date(),
          userSummary: {
            username: members.username,
            type: members['custom:type'],
          }
        }
      };

      if (members['custom:type'] === 'child') {
        params.Item.userSummary.balance = 0;
      }

      return this.dbClient('put', params);
    });

    return Promise.all(joinPromises);
  }
}
