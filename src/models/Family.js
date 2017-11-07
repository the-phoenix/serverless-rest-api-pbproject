import { pick } from 'ramda';
import uuidv1 from 'uuid/v1';
import dbClient from 'utils/db-client';
import UserModel from './User';

const FAMILY_TABLENAME = 'Families';
const FAMILY_USER_TABLENAME = 'FamiliesUsers';

export default class FamilyModel {
  constructor() {
    this.dbClient = dbClient;
    this.user = new UserModel();
  }

  fetchById(id) {
    const params = {
      TableName: FAMILY_TABLENAME,
      Key: { id }
    };

    return this.dbClient('get', params);
  }

  fetchMembersById(id) {
    const PULL_FROM_COGNITO = ['picture', 'username', 'email'];

    const params = {
      TableName: FAMILY_USER_TABLENAME,
      KeyConditionExpression: 'id = :hkey',
      ExpressionAttributeValues: {
        ':hkey': id
      }
    };

    return this
      .dbClient('query', params)
      .then(({ Items }) => {
        const promises = Items.map(member =>
          this.user
            .getByCognitoUsername(member.userSummary['cognito:username'])
            .then(cognitoUser => ({
              ...member,
              userSummary: {
                ...member.userSummary,
                ...pick(PULL_FROM_COGNITO, cognitoUser)
              }
            })));

        return Promise.all(promises);
      });
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

  create(familyAdminUser) {
    const SUMMARY_WHITE_LIST = ['userId', 'email'];
    const params = {
      TableName: FAMILY_TABLENAME,
      Item: {
        id: uuidv1(),
        name: `${familyAdminUser.name || familyAdminUser.username}'s Family`,
        created: (new Date()).toISOString(),
        adminSummary: pick(SUMMARY_WHITE_LIST, familyAdminUser)
      }
    };

    return this.dbClient('put', params).then(() => params.Item);
  }

  join(familyId, member) {
    const SUMMARY_WHITE_LIST = ['username', 'type', 'cognito:username'];

    const params = {
      TableName: FAMILY_USER_TABLENAME,
      Item: {
        id: familyId,
        userId: member.userId,
        created: (new Date()).toISOString(),
        userSummary: pick(SUMMARY_WHITE_LIST, member)
      }
    };

    if (member.type === 'child') {
      params.Item.userSummary = {
        ...params.Item.userSummary,
        balance: 0,
        completedJobs: 0
      };
    }

    return this.dbClient('put', params);
  }

  checkIsFamilyMember(familyId, userId) {
    const isInFamily = fMembers => !!(fMembers
      .find(fmem => fmem.userId === userId));

    return this
      .fetchMembersById(familyId)
      .then(isInFamily);
  }
}
